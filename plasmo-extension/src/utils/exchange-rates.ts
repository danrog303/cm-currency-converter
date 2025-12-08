interface ExchangeRateResponse {
  rate: number | string
  lastUpdateDate: string
}

interface CurrencyCacheData {
  rate: number
  lastUpdateDate: string
}

const EXCHANGE_RATE_CACHE_PREFIX = "ccc-exchangeRate-"
const EXCHANGE_RATE_ENDPOINT_BASE = "https://currency.danielrogowski.net/EUR"

const getExchangeRateCacheKey = (currencyCode: string) =>
  `${EXCHANGE_RATE_CACHE_PREFIX}${currencyCode}`

const getExchangeRateEndpoint = (currencyCode: string) =>
  `${EXCHANGE_RATE_ENDPOINT_BASE}/${currencyCode}`

const exchangeRatePromises = new Map<string, Promise<number>>()

export const readCachedExchangeRate = (currencyCode: string): CurrencyCacheData | null => {
  const cacheKey = getExchangeRateCacheKey(currencyCode)
  try {
    const rawCache = localStorage.getItem(cacheKey)
    return rawCache === null ? null : (JSON.parse(rawCache) as CurrencyCacheData)
  } catch {
    return null
  }
}

const saveCachedExchangeRate = (currencyCode: string, cache: CurrencyCacheData): void => {
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
  const cacheData: CurrencyCacheData = {
    rate: parseFloat(String(payload.rate)),
    lastUpdateDate: String(payload.lastUpdateDate)
  }

  saveCachedExchangeRate(currencyCode, cacheData)
  return cacheData
}

export const getEuroToLocalExchangeRate = async (currencyCode: string): Promise<number> => {
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

