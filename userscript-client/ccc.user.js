// ==UserScript==
// @name         CCC: Cardmarket Currency Converter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Replaces price of cards on Cardmarket.com from Euro to user's local currency.
// @author       Daniel Rogowski (github.com/danrog303)
// @match        https://www.cardmarket.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cardmarket.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const userCurrencyCode = "PLN";
    const userCurrencyDisplaySymbol = "zł";

    const fetchCurrencyExchangeRate = async () => {
        const euroExchangeRateEndpoint = `https://currency-conversion.danielrogowski.net/EUR/${userCurrencyCode}`;
        const euroExchangeRateResponse = await fetch(euroExchangeRateEndpoint);
        const euroExchangeRate = await euroExchangeRateResponse.json();

        const currencyCacheData = {
            rate: parseFloat(euroExchangeRate.rate),
            lastUpdateDate: new Date(euroExchangeRate.lastUpdateDate)
        };

        localStorage.setItem(`ccc-exchangeRate-${userCurrencyCode}`, JSON.stringify(currencyCacheData));
        return currencyCacheData;
    }

    const getEuroToLocalCurrencyExchangeRate = async () => {
        const currentDate = new Date().toISOString().slice(0, 10);
        let currencyExchangeRate = JSON.parse(localStorage.getItem(`ccc-exchangeRate-${userCurrencyCode}`));
        if (currencyExchangeRate === null || currencyExchangeRate.lastUpdateDate !== currentDate) {
            currencyExchangeRate = await fetchCurrencyExchangeRate();
        }

        return currencyExchangeRate.rate;
    }

    const convertEuroToPln = async (priceInEur) => {
        return priceInEur * (await getEuroToLocalCurrencyExchangeRate());
    }

    const convertCurrenciesInDocumentBody = () => {
        const itemPriceXpath = `//*[contains(text(), ',') and contains(text(), '€')]`;
        const itemPriceXpathResult = document.evaluate(itemPriceXpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        for (let i = 0; i < itemPriceXpathResult.snapshotLength; i++) {
            const itemPriceDomElement = itemPriceXpathResult.snapshotItem(i);
            replaceCurrencyStringsInElement(itemPriceDomElement).then();
        }
    }

    const replaceCurrencyStringsInElement = async (domElement) => {
        let domElementInnerText = domElement.innerText;
        const itemPriceRegex = /\d+[,.]\d{2} €/g;
        const itemPriceRegexMatches = [...domElementInnerText.matchAll(itemPriceRegex)];

        for (const itemPriceRegexMatch of itemPriceRegexMatches) {
            const itemPriceInEuroString = itemPriceRegexMatch[0];
            const itemPriceInEuro = parseFloat(itemPriceInEuroString.replace("€", "").replace(",", "."));

            const itemPriceInPln = await convertEuroToPln(itemPriceInEuro);
            const itemPriceInPlnString = `${itemPriceInPln.toFixed(2).replace('.', ',')} ${userCurrencyDisplaySymbol}`;
            domElementInnerText = domElementInnerText.replaceAll(itemPriceInEuroString, itemPriceInPlnString);
        }

        // Temporarily disables mutation observer in order to avoid infinite loop
        observer.disconnect();
        domElement.innerText = domElementInnerText;
        observer.observe(document.body, observerOptions);
    }

    const onWebsiteContentMutated = (mutationList, observer) => {
        convertCurrenciesInDocumentBody();
    };

    const observer = new MutationObserver(onWebsiteContentMutated);
    const observerOptions = {childList: true, subtree: true};
    observer.observe(document.body, observerOptions);
    convertCurrenciesInDocumentBody();
})();
