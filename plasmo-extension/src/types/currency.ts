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
  { code: "PLN", symbol: "zł", label: "Polski złoty (PLN)" },
  { code: "USD", symbol: "$", label: "Dolar amerykański (USD)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)" },
  { code: "GBP", symbol: "£", label: "Funt brytyjski (GBP)" },
  { code: "CHF", symbol: "CHF", label: "Frank szwajcarski (CHF)" },
  { code: "CZK", symbol: "Kč", label: "Korona czeska (CZK)" },
  { code: "HUF", symbol: "Ft", label: "Forint węgierski (HUF)" },
  { code: "SEK", symbol: "kr", label: "Korona szwedzka (SEK)" },
  { code: "NOK", symbol: "kr", label: "Korona norweska (NOK)" },
  { code: "DKK", symbol: "kr", label: "Korona duńska (DKK)" },
  { code: "RON", symbol: "lei", label: "Lej rumuński (RON)" }
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

