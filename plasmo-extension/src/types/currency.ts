export interface CurrencySettings {
  code: string
  symbol: string
}

export interface CurrencyPreset {
  code: string
  symbol: string
  label: string
}

export const STORAGE_KEY = "ccc-currency-settings"

export const DEFAULT_CURRENCY: CurrencySettings = {
  code: "PLN",
  symbol: "zł"
}

export const CURRENCY_PRESETS: CurrencyPreset[] = [
  { code: "PLN", symbol: "zł", label: "Złoty polski (PLN)" },
  { code: "USD", symbol: "$", label: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)" },
  { code: "GBP", symbol: "£", label: "British Pound (GBP)" },
  { code: "CHF", symbol: "CHF", label: "Schweizer Franken (CHF)" },
  { code: "CZK", symbol: "Kč", label: "Česká koruna (CZK)" },
  { code: "HUF", symbol: "Ft", label: "Magyar forint (HUF)" },
  { code: "SEK", symbol: "kr", label: "Svensk krona (SEK)" },
  { code: "NOK", symbol: "kr", label: "Norske kroner (NOK)" },
  { code: "DKK", symbol: "kr", label: "Dansk krone (DKK)" },
  { code: "RON", symbol: "lei", label: "Leu românesc (RON)" }
]

export const isCurrencySettings = (payload: unknown): payload is CurrencySettings => {
  if (typeof payload !== "object" || payload === null) {
    return false
  }

  const candidate = payload as Record<string, unknown>
  return typeof candidate.code === "string" && typeof candidate.symbol === "string"
}

export const normalizeCurrencySettings = (settings: CurrencySettings): CurrencySettings => ({
  code: settings.code.trim().toUpperCase() || DEFAULT_CURRENCY.code,
  symbol: settings.symbol.trim() || settings.code.trim() || DEFAULT_CURRENCY.symbol
})

