import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { CURRENCY_PRESETS, DEFAULT_CURRENCY, type CurrencySettings } from "./types/currency"
import { readCurrencySettings, writeCurrencySettings } from "./utils/storage"

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

  const styles = {
    container: {
      fontFamily: '"Segoe UI", Tahoma, sans-serif',
      background: "#0f172a",
      color: "#f1f5f9",
      margin: 0,
      padding: "16px",
      width: "320px",
      minHeight: "200px"
    },
    title: {
      fontSize: "16px",
      margin: "0 0 12px"
    },
    form: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "12px"
    },
    label: {
      display: "flex",
      flexDirection: "column" as const,
      fontSize: "12px",
      gap: "4px"
    },
    select: {
      padding: "6px",
      borderRadius: "4px",
      border: "1px solid #1e293b",
      background: "#1e293b",
      color: "#f1f5f9"
    },
    input: {
      padding: "6px",
      borderRadius: "4px",
      border: "1px solid #1e293b",
      background: "#1e293b",
      color: "#f1f5f9"
    },
    button: {
      padding: "8px",
      border: "none",
      borderRadius: "4px",
      fontWeight: 600,
      cursor: "pointer",
      background: "#38bdf8",
      color: "#0f172a"
    },
    buttonDisabled: {
      padding: "8px",
      border: "none",
      borderRadius: "4px",
      fontWeight: 600,
      cursor: "progress",
      background: "#38bdf8",
      color: "#0f172a",
      opacity: 0.6
    },
    hint: {
      fontSize: "11px",
      color: "#cbd5f5",
      margin: 0
    },
    status: {
      minHeight: "16px",
      fontSize: "12px",
      color: status?.tone === "error" ? "#f87171" : status?.tone === "success" ? "#4ade80" : "transparent"
    }
  }

  if (!isInitialized) {
    return (
      <div style={styles.container}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Target Currency</h1>
      <form style={styles.form} onSubmit={handleSubmit}>
        <label style={styles.label}>
          Currency
          <select
            style={styles.select}
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
        <label style={styles.label}>
          Display Symbol
          <input
            style={styles.input}
            type="text"
            value={currencySymbol}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleSymbolChange(e.target.value)}
            maxLength={4}
            required
          />
        </label>
        <p style={styles.hint}>
          Changing currency may require refreshing open Cardmarket tabs.
        </p>
        <button
          type="submit"
          style={isLoading ? styles.buttonDisabled : styles.button}
          disabled={isLoading}
        >
          Save
        </button>
        <div style={styles.status} role="status">
          {status?.message}
        </div>
      </form>
    </div>
  )
}

export default IndexPopup
