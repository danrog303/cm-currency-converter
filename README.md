# cm-currency-converter  
![License badge](https://shields.io/github/license/danrog303/cm-currency-converter)
![Author badge](https://img.shields.io/badge/author-danrog303-informational)
> Browser extension for converting item prices on Cardmarket.com

Polish version of readme file 🇵🇱 [is available here](https://github.com/danrog303/cm-currency-converter/blob/main/README.pl.md).

## ℹ️ What is this project?
**cm-currency-converter** (in short ccc) is a browser extension that enables price conversion on https://cardmarket.com. By default, the website displays prices only in Euros, but with the use of the extension, it is possible to convert prices to any currency of your choice.

## 🖥️ How to use the extension?
1. Install [Node.js 18+](https://nodejs.org/) and clone this repository.
2. Enter the `plasmo-extension` directory and install dependencies:
   ```
   cd plasmo-extension
   npm install
   npm run dev
   ```
3. Open `chrome://extensions`, enable **Developer Mode** and click **Load unpacked**.
4. Select the `.plasmo/output/default/chrome-mv3-dev` directory that was generated in step 2.

Use `npm run build` for a production build and `npm run package` to create the zip file that can be uploaded to the Chrome Web Store.

After loading the extension, click its toolbar icon to open the popup and choose your target currency + display symbol. Refresh open Cardmarket tabs once you save the new setting.

The extension boots with EUR → PLN but you can change the target currency at any moment via the popup (the choice is stored in `chrome.storage.sync`).

## 🏗 Project structure
The project consists of two parts:
1. **plasmo-extension**:  
   - Manifest V3 Chrome extension built with Plasmo. It injects a content script on Cardmarket pages, fetches exchange rates from **api-lambda**, and replaces prices in the DOM
2. **api-lambda**:  
   - AWS Lambda function that retrieves currency exchange rates from https://exchangerate-api.com and caches the result in a DynamoDB table
   - Working instance of the lambda function is available here: https://currency.danielrogowski.net/eur/usd

## Screenshots
![obraz](https://github.com/deru303/lab6/assets/82843647/4adf8425-a548-462e-b2b9-ce11301a304e)