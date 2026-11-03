import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen
from zipfile import ZipFile


# The API guide and REST enum reference use different names for this state.
UPLOAD_PENDING = {"IN_PROGRESS", "UPLOAD_IN_PROGRESS"}


def version_key(version):
    if not re.fullmatch(r"(?:0|[1-9][0-9]{0,4})(?:\.(?:0|[1-9][0-9]{0,4})){0,3}", version):
        raise ValueError(f"Invalid Chrome version: {version}")
    parts = tuple(map(int, version.split(".")))
    if not any(parts) or max(parts) > 65535:
        raise ValueError(f"Invalid Chrome version: {version}")
    return parts + (0,) * (4 - len(parts))


def validate_package(package):
    with ZipFile(package) as archive:
        damaged = archive.testzip()
        if damaged:
            raise ValueError(f"Damaged ZIP entry: {damaged}")

        manifest = json.loads(archive.read("manifest.json"))
        if manifest["manifest_version"] != 3:
            raise ValueError("Expected Manifest V3")

        version = manifest["version"]
        version_key(version)
        package_json = Path(__file__).resolve().parents[2] / "plasmo-extension/package.json"
        if version != json.loads(package_json.read_text(encoding="utf-8"))["version"]:
            raise ValueError("Chrome manifest version differs from package.json")

        action = manifest["action"]
        if "storage" not in manifest.get("permissions", []):
            raise ValueError("Chrome storage permission is missing")

        files = {action["default_popup"], *manifest["icons"].values()}
        for script in manifest["content_scripts"]:
            if script["matches"] != ["https://www.cardmarket.com/*"]:
                raise ValueError("Content scripts must match only Cardmarket")
            files.update(script.get("js", []))
            files.update(script.get("css", []))

        missing = files.difference(archive.namelist())
        if missing:
            raise ValueError(f"Manifest files missing from ZIP: {sorted(missing)}")
        return version


def store_request(url, data=None, content_type=None, *, method=None, expect_json=True):
    headers = {"Authorization": f"Bearer {os.environ['CWS_TOKEN']}"}
    if content_type:
        headers["Content-Type"] = content_type
    request = Request(url, data=data, headers=headers, method=method)
    with urlopen(request, timeout=60) as response:
        if expect_json:
            return json.load(response)


def wait_for_upload(status_url):
    for _ in range(24):
        time.sleep(5)
        state = store_request(status_url).get("lastAsyncUploadState")
        if state not in UPLOAD_PENDING:
            return state
    raise ValueError("Chrome Web Store upload is still processing")


def submit(package, version):
    publisher = quote(os.environ["CWS_PUBLISHER_ID"], safe="")
    extension = quote(os.environ["CWS_EXTENSION_ID"], safe="")
    resource = f"publishers/{publisher}/items/{extension}"
    api = "https://chromewebstore.googleapis.com"
    item_url = f"{api}/v2/{resource}"
    status_url = f"{item_url}:fetchStatus"
    status = store_request(status_url)
    published = status.get("publishedItemRevisionStatus", {})
    submitted = status.get("submittedItemRevisionStatus", {})
    store_versions = [
        channel["crxVersion"]
        for revision in (published, submitted)
        for channel in revision.get("distributionChannels", [])
    ]

    if any(version_key(version) <= version_key(existing) for existing in store_versions):
        print(f"Skipping upload of {version}. Chrome Web Store versions: {', '.join(store_versions)}")
        return

    submitted_state = submitted.get("state")
    if submitted_state == "STAGED":
        raise ValueError("Finish the staged release before submitting a newer version")
    if status.get("lastAsyncUploadState") in UPLOAD_PENDING:
        raise ValueError("A previous upload is still processing. Check the Developer Dashboard before retrying")

    package_data = package.read_bytes()
    if submitted_state == "PENDING_REVIEW":
        if not submitted.get("distributionChannels"):
            raise ValueError("Cannot confirm the version under review. Check the Developer Dashboard")
        store_request(f"{item_url}:cancelSubmission", method="POST", expect_json=False)
        print(f"Cancelled the previous review before uploading {version}")

    upload_url = f"{api}/upload/v2/{resource}:upload"
    upload = store_request(upload_url, package_data, "application/zip")
    state = upload.get("uploadState")
    if state in UPLOAD_PENDING:
        state = wait_for_upload(status_url)
    if state != "SUCCEEDED":
        raise ValueError(f"Chrome Web Store upload did not succeed: {state}")
    if upload.get("crxVersion", version) != version:
        raise ValueError("Chrome Web Store returned an unexpected package version")

    payload = json.dumps({"publishType": "DEFAULT_PUBLISH"}).encode("utf-8")
    submission = store_request(f"{item_url}:publish", payload, "application/json")
    state = submission.get("state")
    if state not in {"PENDING_REVIEW", "PUBLISHED", "PUBLISHED_TO_TESTERS"}:
        raise ValueError(f"Unexpected Chrome Web Store submission state: {state}")
    print(f"Chrome Web Store version {version}: {state}")


if __name__ == "__main__":
    command, filename = sys.argv[1:]
    package = Path(filename)
    try:
        version = validate_package(package)
        print(f"Validated Chrome extension package {version}")
        if command == "submit":
            submit(package, version)
        elif command != "validate":
            raise ValueError(f"Unknown command: {command}")
    except HTTPError as error:
        try:
            details = json.load(error).get("error", {}).get("message", error.reason)
        except ValueError:
            details = error.reason
        sys.exit(f"Chrome Web Store API returned HTTP {error.code}: {details}")
