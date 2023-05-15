# cm-currency-converter  
![License badge](https://shields.io/github/license/danrog303/cm-currency-converter)
![Author badge](https://img.shields.io/badge/author-danrog303-informational)
> Browser extension for converting item prices on Cardmarket.com

Polish version of readme file 🇵🇱 [is available here](https://github.com/danrog303/cm-currency-converter/blob/main/README.pl.md).

## ℹ️ What is this project?
**cm-currency-converter** (in short ccc) is a browser extension that enables price conversion on https://cardmarket.com. By default, the website displays prices only in Euros, but with the use of the extension, it is possible to convert prices to any currency of your choice.

## 🖥️ How to use the extension?
1. Install the Tampermonkey extension
   - Firefox: [link](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Google Chrome: [link](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
   - Opera: [link](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)
   - Microsoft Edge: [link](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
   - Safari: [link](https://apps.apple.com/app/apple-store/id1482490089?mt=8)
2. Click [here](https://raw.githubusercontent.com/danrog303/cm-currency-converter/main/userscript-client/ccc.user.js) to call the user script installer
3. Install the script by following on-screen instructions

By default, the script converts prices from EUR to PLN. The target currency can be changed by editing the **userCurrencyCode** and **userCurrencyDisplaySymbol** variables in the script code.

## 🏗 Project structure
The project consists of two parts:
1. **user-script-client**:  
   - Tampermonkey userscript that fetches currency exchange rates from **api-lambda** and replaces prices on the website
2. **api-lambda**:  
   - AWS Lambda function that retrieves currency exchange rates from https://exchangerate-api.com and caches the result in a DynamoDB table
   - Working instance of the lambda function is available here: https://currency.danielrogowski.net/eur/usd

## Screenshots
![obraz](https://github.com/deru303/lab6/assets/82843647/4adf8425-a548-462e-b2b9-ce11301a304e)