# Cardmarket Currency Converter (Plasmo)

Manifest V3 Chrome extension that injects a content script on Cardmarket pages and rewrites prices using exchange rates from `https://currency.danielrogowski.net`.

## Development

```
cd plasmo-extension
npm install
npm run dev
```

Load `.plasmo/output/default/chrome-mv3-dev` via `chrome://extensions` → Developer Mode → Load unpacked.

Production build commands:

```
npm run build
npm run package
```

## Choosing the target currency

Click the extension icon to open the popup and pick your preferred currency + display symbol. The selection is stored in `chrome.storage.sync`. Refresh open Cardmarket tabs after saving to apply the new setting.






