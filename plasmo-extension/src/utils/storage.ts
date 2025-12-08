import type { CurrencySettings } from "../types/currency"
import { STORAGE_KEY, DEFAULT_CURRENCY, isCurrencySettings, normalizeCurrencySettings } from "../types/currency"

const getChromeStorageSync = () => {
  try {
    if (typeof chrome !== "undefined" && chrome?.storage?.sync) {
      return chrome.storage.sync
    }
  } catch {
    // Ignore
  }
  return null
}

export const readCurrencySettings = (): Promise<CurrencySettings> =>
  new Promise((resolve) => {
    const storage = getChromeStorageSync()
    const fallbackStorage = window.localStorage

    const handleResult = (value: unknown) => {
      if (isCurrencySettings(value)) {
        resolve(normalizeCurrencySettings(value))
      } else {
        resolve(DEFAULT_CURRENCY)
      }
    }

    if (storage) {
      storage.get([STORAGE_KEY], (result: Record<string, unknown>) => {
        handleResult(result?.[STORAGE_KEY])
      })
    } else {
      const raw = fallbackStorage.getItem(STORAGE_KEY)
      handleResult(raw ? JSON.parse(raw) : null)
    }
  })

export const writeCurrencySettings = (settings: CurrencySettings): Promise<void> =>
  new Promise((resolve, reject) => {
    const storage = getChromeStorageSync()
    const fallbackStorage = window.localStorage
    const payload = normalizeCurrencySettings(settings)

    if (storage) {
      storage.set({ [STORAGE_KEY]: payload }, () => {
        const error = chrome.runtime?.lastError
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    } else {
      fallbackStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      resolve()
    }
  })

type ChromeStorageChanges = Record<
  string,
  {
    newValue?: unknown
  }
>

export const subscribeToCurrencySettingChanges = (
  callback: (settings: CurrencySettings) => void
): void => {
  try {
    if (!chrome?.storage?.onChanged) {
      return
    }

    chrome.storage.onChanged.addListener((changes: ChromeStorageChanges, areaName: string) => {
      if (areaName !== "sync") {
        return
      }

      const delta = changes[STORAGE_KEY]
      if (!delta || !isCurrencySettings(delta.newValue)) {
        return
      }

      callback(normalizeCurrencySettings(delta.newValue))
    })
  } catch {
    // Ignore
  }
}

