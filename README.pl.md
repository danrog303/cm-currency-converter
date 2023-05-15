# cm-currency-converter
![License badge](https://shields.io/github/license/danrog303/cm-currency-converter)
![Author badge](https://img.shields.io/badge/author-Daniel%20Rogowski-informational)
> Wtyczka do przeglądarki konwertująca ceny w serwisie Cardmarket.com

Angielska wersja pliku readme 🇬🇧 [jest dostępna tutaj](https://github.com/danrog303/cm-currency-converter/blob/main/README.md).

## ℹ️ Czym jest ten projekt?
**cm-currency-converter** (w skrócie ccc) jest wtyczką do przeglądarki, która umożliwia konwersję cen na stronie https://cardmarket.com. Domyślnie strona wyświetla ceny wyłącznie w Euro, ale przy użyciu wtyczki możliwe jest przeliczenie cen na dowolną wybraną przez siebie walutę.

## 🖥️ Jak użyć wtyczki?
1. Zainstaluj wtyczkę Tampermonkey
    - Firefox: [link](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
    - Google Chrome: [link](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
    - Opera: [link](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)
    - Microsoft Edge: [link](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
    - Safari: [link](https://apps.apple.com/app/apple-store/id1482490089?mt=8)
2. Kliknij [tutaj](https://raw.githubusercontent.com/danrog303/cm-currency-converter/main/userscript-client/ccc.user.js), aby wywołać instalator skryptu użytkownika
3. Zainstaluj skrypt, postępując według instrukcji na ekranie

Domyślnie skrypt konwertuje ceny z EUR na PLN. Walutę docelową można zmienić poprzez edycję zmiennych **userCurrencyCode** oraz **userCurrencyDisplaySymbol** w kodzie skryptu.

## 🏗 Struktura projektu
Projekt składa się z dwóch częsci:
1. **user-script-client**:
   - skrypt Tampermonkey, który pobiera kursy walut z **api-lambda** i podmienia ceny na stronie cardmarket.com
2. **api-lambda**:
   - funkcja AWS Lambda, która pobiera kursy walut z https://exchangerate-api.com i cachuje je w tabeli DynamoDB
   - działająca instancja funkcji Lambda jest dostępna tutaj: https://currency.danielrogowski.net/eur/usd

## Zrzuty ekranu
![obraz](https://github.com/deru303/lab6/assets/82843647/4adf8425-a548-462e-b2b9-ce11301a304e)