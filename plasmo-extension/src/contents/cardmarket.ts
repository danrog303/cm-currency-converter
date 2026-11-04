import { syncCartSupportBanner } from "../utils/cart-support-banner"

export const config = {
  matches: ["https://www.cardmarket.com/*"]
}

type ExchangeRateResponse = {
  rates: Record<string, number>
  lastUpdateDate: string
  responseType: string
}

type CurrencyCacheData = {
  rate: number
  lastUpdateDate: string
}

type CurrencySettings = {
  code: string
  symbol: string
}

const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  code: "PLN",
  symbol: "zł"
}

const CURRENCY_SETTINGS_STORAGE_KEY = "ccc-currency-settings"
const PRICE_REGEX = /\d+[,.]\d{2} €/g
const OBSERVER_OPTIONS: MutationObserverInit = { childList: true, subtree: true }

let activeCurrencySettings: CurrencySettings = DEFAULT_CURRENCY_SETTINGS
const exchangeRatePromises = new Map<string, Promise<number>>()

const getExchangeRateCacheKey = (currencyCode: string) =>
  `ccc-exchangeRate-${currencyCode}`

const getExchangeRateEndpoint = (currencyCode: string) =>
  `https://34wx13a345.execute-api.eu-central-1.amazonaws.com/Prod/currency/${currencyCode}`

const isCurrencySettings = (payload: unknown): payload is CurrencySettings => {
  if (typeof payload !== "object" || payload === null) {
    return false
  }

  const candidate = payload as Record<string, unknown>
  return typeof candidate.code === "string" && typeof candidate.symbol === "string"
}

const normalizeCurrencySettings = (settings: CurrencySettings): CurrencySettings => ({
  code: settings.code.trim().toUpperCase() || DEFAULT_CURRENCY_SETTINGS.code,
  symbol: settings.symbol.trim() || DEFAULT_CURRENCY_SETTINGS.symbol
})

const applyCurrencySettings = (settings: CurrencySettings) => {
  activeCurrencySettings = normalizeCurrencySettings(settings)
}

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

const readCurrencySettings = async (): Promise<CurrencySettings> => {
  const storage = getChromeStorageSync()
  if (!storage) {
    return DEFAULT_CURRENCY_SETTINGS
  }

  return new Promise((resolve) => {
    storage.get([CURRENCY_SETTINGS_STORAGE_KEY], (result: Record<string, unknown>) => {
      const storedValue = result?.[CURRENCY_SETTINGS_STORAGE_KEY]
      resolve(
        isCurrencySettings(storedValue)
          ? normalizeCurrencySettings(storedValue)
          : DEFAULT_CURRENCY_SETTINGS
      )
    })
  })
}

type ChromeStorageChanges = Record<
  string,
  {
    newValue?: unknown
  }
>

const subscribeToCurrencySettingChanges = () => {
  try {
    if (!chrome?.storage?.onChanged) {
      return
    }

    chrome.storage.onChanged.addListener(
      (changes: ChromeStorageChanges, areaName: string) => {
        if (areaName !== "sync") {
          return
        }

        const delta = changes[CURRENCY_SETTINGS_STORAGE_KEY]
        if (!delta || !isCurrencySettings(delta.newValue)) {
          return
        }

        applyCurrencySettings(delta.newValue)
        convertCurrenciesInDocumentBody()
      }
    )
  } catch {
    // Ignore
  }
}

const readCachedExchangeRate = (currencyCode: string): CurrencyCacheData | null => {
  const cacheKey = getExchangeRateCacheKey(currencyCode)
  try {
    const rawCache = localStorage.getItem(cacheKey)
    return rawCache === null ? null : (JSON.parse(rawCache) as CurrencyCacheData)
  } catch {
    return null
  }
}

const saveCachedExchangeRate = (currencyCode: string, cache: CurrencyCacheData) => {
  const cacheKey = getExchangeRateCacheKey(currencyCode)
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cache))
  } catch {
    // Local storage might be unavailable (incognito mode, etc.), fail silently.
  }
}

const fetchExchangeRate = async (currencyCode: string): Promise<CurrencyCacheData> => {
  const endpoint = getExchangeRateEndpoint(currencyCode)
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`Currency endpoint responded with ${response.status}`)
  }

  const payload = (await response.json()) as ExchangeRateResponse
  const eurRate = payload.rates["EUR"]

  if (!eurRate) {
    throw new Error("Missing EUR rate in response")
  }

  const cacheData: CurrencyCacheData = {
    // The API returns rates relative to the requested currency (e.g. 1 PLN = 0.23 EUR).
    // We need the rate from EUR to the requested currency (e.g. 1 EUR = 4.3 PLN).
    rate: 1 / eurRate,
    lastUpdateDate: String(payload.lastUpdateDate)
  }

  saveCachedExchangeRate(currencyCode, cacheData)
  return cacheData
}

const getEuroToLocalExchangeRate = async (currencyCode: string): Promise<number> => {
  const existingPromise = exchangeRatePromises.get(currencyCode)
  if (existingPromise) {
    return existingPromise
  }

  const pendingPromise = (async () => {
    const currentDate = new Date().toISOString().slice(0, 10)
    const cachedExchangeRate = readCachedExchangeRate(currencyCode)

    if (cachedExchangeRate && cachedExchangeRate.lastUpdateDate === currentDate) {
      return cachedExchangeRate.rate
    }

    const freshExchangeRate = await fetchExchangeRate(currencyCode)

    if (freshExchangeRate.lastUpdateDate !== currentDate) {
      saveCachedExchangeRate(currencyCode, {
        ...freshExchangeRate,
        lastUpdateDate: currentDate
      })
    }

    return freshExchangeRate.rate
  })()

  exchangeRatePromises.set(currencyCode, pendingPromise)

  try {
    return await pendingPromise
  } finally {
    exchangeRatePromises.delete(currencyCode)
  }
}

const convertEuroToLocalCurrency = async (
  priceInEur: number,
  settings: CurrencySettings
): Promise<number> => {
  const exchangeRate = await getEuroToLocalExchangeRate(settings.code)
  return priceInEur * exchangeRate
}

const formatLocalCurrency = (value: number, settings: CurrencySettings): string => {
  return `${value.toFixed(2).replace(".", ",")} ${settings.symbol}`
}

const replaceCurrencyStringsInElement = async (
  domElement: HTMLElement,
  settings: CurrencySettings
) => {
  const originalText = domElement.innerText
  const matches = [...originalText.matchAll(PRICE_REGEX)]

  if (matches.length === 0) {
    return
  }

  let updatedText = originalText
  for (const match of matches) {
    const priceInEuroString = match[0]
    const priceInEuro = parseFloat(
      priceInEuroString.replace(/[€\s]/g, "").replace(",", ".")
    )

    const localCurrencyPrice = await convertEuroToLocalCurrency(priceInEuro, settings)
    const formattedPrice = formatLocalCurrency(localCurrencyPrice, settings)
    updatedText = updatedText.replaceAll(priceInEuroString, formattedPrice)
  }

  observer?.disconnect()
  domElement.innerText = updatedText
  resumeObserver()
}

const convertCurrenciesInDocumentBody = () => {
  if (!document.body) {
    return
  }

  const xpath = `//*[contains(text(), ',') and contains(text(), '€')]`
  const xpathResult = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  )

  for (let i = 0; i < xpathResult.snapshotLength; i += 1) {
    const node = xpathResult.snapshotItem(i)
    if (node instanceof HTMLElement) {
      replaceCurrencyStringsInElement(node, activeCurrencySettings).catch((error) =>
        console.error("[CCC] Failed to convert currency string", error)
      )
    }
  }
}

let observer: MutationObserver | null = null

const resumeObserver = () => {
  if (observer && document.body) {
    observer.observe(document.body, OBSERVER_OPTIONS)
  }
}

const onContentMutated: MutationCallback = () => {
  syncCartSupportBanner()
  convertCurrenciesInDocumentBody()
}

const startObserver = () => {
  if (observer !== null || !document.body) {
    return
  }

  observer = new MutationObserver(onContentMutated)
  resumeObserver()
}

const initialize = async () => {
  if (!document.body) {
    return
  }

  try {
    await readCurrencySettings().then(applyCurrencySettings)
  } catch {
    applyCurrencySettings(DEFAULT_CURRENCY_SETTINGS)
  }

  subscribeToCurrencySettingChanges()
  syncCartSupportBanner()
  startObserver()
  convertCurrenciesInDocumentBody()
}

const bootstrap = () => {
  initialize().catch((error) =>
    console.error("[CCC] Failed to initialize currency converter", error)
  )
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true })
} else {
  bootstrap()
}

