import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { CURRENCY_PRESETS, DEFAULT_CURRENCY, type CurrencySettings } from "./types/currency"
import { readCurrencySettings, writeCurrencySettings } from "./utils/storage"
import { COFFEE_ICON_PATH, SUPPORT_LINK_TEXT, SUPPORT_URL } from "./utils/support"

import "./popup.css"

interface StatusMessage {
  message: string
  tone: "info" | "success" | "error"
}

function IndexPopup() {
  const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY.code)
  const [currencySymbol, setCurrencySymbol] = useState<string>(DEFAULT_CURRENCY.symbol)
  const [symbolDirty, setSymbolDirty] = useState<boolean>(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await readCurrencySettings()
      setCurrencyCode(settings.code)
      setCurrencySymbol(settings.symbol)
      setIsInitialized(true)
    }
    loadSettings()
  }, [])

  const handleSymbolChange = (value: string) => {
    setCurrencySymbol(value)
    setSymbolDirty(true)
  }

  const handleCodeChange = (value: string) => {
    setCurrencyCode(value)
    const preset = CURRENCY_PRESETS.find((entry) => entry.code === value)
    if (preset && !symbolDirty) {
      setCurrencySymbol(preset.symbol)
      setSymbolDirty(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus(null)
    setIsLoading(true)

    const payload: CurrencySettings = {
      code: currencyCode,
      symbol: currencySymbol
    }

    try {
      await writeCurrencySettings(payload)
      setStatus({ message: "Saved! Refresh Cardmarket pages.", tone: "success" })
      setSymbolDirty(false)
    } catch (error) {
      console.error("[CCC] Failed to persist currency settings", error)
      setStatus({ message: "Failed to save settings.", tone: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isInitialized) {
    return (
      <main className="popup">
        <div role="status">Loading...</div>
      </main>
    )
  }

  return (
    <main className="popup">
      <h1>Cardmarket Currency Converter</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Target Currency
          <select
            value={currencyCode}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleCodeChange(e.target.value)}
            required
          >
            {CURRENCY_PRESETS.map((preset) => (
              <option key={preset.code} value={preset.code}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Display Symbol
          <input
            type="text"
            value={currencySymbol}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleSymbolChange(e.target.value)}
            maxLength={4}
            required
          />
        </label>
        <p className="hint">
          Changing currency may require refreshing open Cardmarket tabs.
        </p>
        <button type="submit" disabled={isLoading}>
          Save
        </button>
        <div className="status" data-tone={status?.tone} role="status">
          {status?.message}
        </div>
      </form>
      <footer className="popup-footer">
        <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={COFFEE_ICON_PATH} />
          </svg>
          {SUPPORT_LINK_TEXT}
        </a>
      </footer>
    </main>
  )
}

export default IndexPopup
