# cm-currency-converter
![License badge](https://shields.io/github/license/danrog303/cm-currency-converter)
![Author badge](https://img.shields.io/badge/author-Daniel%20Rogowski-informational)
[![Status CI/CD](https://img.shields.io/github/actions/workflow/status/danrog303/cm-currency-converter/delivery.yml?branch=main&event=push&label=ci%2Fcd&logo=github)](https://github.com/danrog303/cm-currency-converter/actions/workflows/delivery.yml)
> Wtyczka do przeglądarki konwertująca ceny w serwisie Cardmarket.com

Angielska wersja pliku readme 🇬🇧 [jest dostępna tutaj](https://github.com/danrog303/cm-currency-converter/blob/main/README.md).

## ℹ️ Czym jest ten projekt?
**cm-currency-converter** (w skrócie ccc) jest wtyczką do przeglądarki, która umożliwia konwersję cen na stronie https://cardmarket.com. Domyślnie strona wyświetla ceny wyłącznie w Euro, ale przy użyciu wtyczki możliwe jest przeliczenie cen na dowolną wybraną przez siebie walutę.

## 🖥️ Jak użyć wtyczki?
1. Zainstaluj [Node.js 18+](https://nodejs.org/) i sklonuj to repozytorium.
2. Wejdź do katalogu `plasmo-extension` i zainstaluj zależności:
   ```
   cd plasmo-extension
   npm install
   npm run dev
   ```
3. Otwórz `chrome://extensions`, włącz **Tryb deweloperski** i wybierz **Wczytaj rozpakowane**.
4. Wskaż katalog `.plasmo/output/default/chrome-mv3-dev`, który powstał w kroku 2.

 Polecenie `npm run build` tworzy produkcyjny build, a `npm run package` generuje paczkę zip gotową do przesłania do Chrome Web Store.

Po wczytaniu rozszerzenia kliknij jego ikonę na pasku narzędzi, aby otworzyć popup i wybrać walutę docelową oraz symbol wyświetlania. Po zapisaniu ustawienia odśwież otwarte karty Cardmarket.

Domyślnie rozszerzenie startuje z przelicznikiem EUR → PLN, lecz docelową walutę możesz w każdej chwili zmienić w popupie (ustawienie jest zapisywane w `chrome.storage.sync`).

## 🏗 Struktura projektu
Projekt składa się z dwóch częsci:
1. **plasmo-extension**:
   - rozszerzenie Chrome (Manifest V3) zbudowane na Plasmo. Ładuje skrypt treści na stronach Cardmarket, pobiera kursy z **api-lambda** i podmienia ceny w DOM
2. **api-lambda**:
   - funkcja AWS Lambda, która pobiera kursy walut z https://exchangerate-api.com i cachuje je w tabeli DynamoDB
   - [Przykładowa odpowiedź produkcyjnego API dla USD](https://34wx13a345.execute-api.eu-central-1.amazonaws.com/Prod/currency/USD)

## 🔑 Klucz do Exchange Rates API

Lambda odczytuje klucz do https://exchangerate-api.com w trakcie działania z parametru SecureString `/currency-conversion/exchange-rates-api-key` w SSM Parameter Store (szyfrowanego zarządzanym przez AWS kluczem `aws/ssm`, więc nic nie kosztuje). Utwórz go raz w regionie `eu-central-1` przed pierwszym wdrożeniem. Do rotacji klucza użyj tego samego polecenia z flagą `--overwrite`:

```bash
aws ssm put-parameter --region eu-central-1 --type SecureString --name /currency-conversion/exchange-rates-api-key --value '<twój-klucz-api>'
```

Inną nazwę parametru można przekazać przez parametr stosu `ExchangeRatesApiKeyParameterName` (bez początkowego ukośnika).

## Zrzuty ekranu
![obraz](https://github.com/deru303/lab6/assets/82843647/4adf8425-a548-462e-b2b9-ce11301a304e)
