import fetch from "node-fetch";
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

const awsRegion = process.env.AWS_LAMBDA_REGION;
const exchangeRatesApiKey = process.env.EXCHANGE_RATES_API_KEY;
const dynamoDBCacheTableName = process.env.DYNAMODB_CACHE_TABLE;
const dynamoDB = new DynamoDBClient({ region: awsRegion });

/**
 * If DynamoDB cache table contains a valid cache, returns cached Exchange Rates API response.
 * Otherwise, returns null.
 */
const fetchExchangeRatesFromCache = async (sourceCurrency) => {
    const todayDate = new Date().toISOString().slice(0, 10);
    const itemGetParams = {
        TableName: dynamoDBCacheTableName,
        Key: {
            sourceCurrency: { S: sourceCurrency },
            lastUpdateDate: { S: todayDate }
        }
    };

    const currencyCacheResponse = await dynamoDB.send(new GetItemCommand(itemGetParams));
    if (!currencyCacheResponse.hasOwnProperty("Item")) {
        return null;
    }

    const currencyCacheData = unmarshall(currencyCacheResponse.Item);
    if (todayDate !== currencyCacheData.lastUpdateDate) {
        return null;
    }

    return currencyCacheData;
};

/**
 * Writes the Exchange Rates API response to the DynamoDB cache.
 */
const putExchangeRatesInCache = async (exchangeRatesToCache) => {
    const itemCreateParams = {
        TableName: dynamoDBCacheTableName,
        Item: {
            sourceCurrency: { S: exchangeRatesToCache.sourceCurrency },
            lastUpdateDate: { S: exchangeRatesToCache.lastUpdateDate },
            rates: { M: marshall(exchangeRatesToCache.rates) }
        }
    };

    await dynamoDB.send(new PutItemCommand(itemCreateParams));
};

/**
 * Downloads exchange rates from the Exchange Rates API.
 */
const fetchExchangeRateFromRemoteApi = async (sourceCurrency) => {
    const exchangeRateEndpoint = `https://v6.exchangerate-api.com/v6/${exchangeRatesApiKey}/latest/${sourceCurrency}`;
    const exchangeRateJson = await fetch(exchangeRateEndpoint);
    const exchangeRateData = await exchangeRateJson.json();

    const rates = exchangeRateData['conversion_rates'];
    const lastUpdateDate = new Date(exchangeRateData['time_last_update_utc']).toISOString().slice(0, 10);
    return {sourceCurrency, rates, lastUpdateDate};
};

/**
 * Handles GET request to the API Gateway HTTP endpoint.
 */
export const lambdaHandler = async (event) => {
    // Read and parse user input
    let { sourceCurrencySymbol, destinationCurrencySymbol } = event.pathParameters;
    sourceCurrencySymbol = sourceCurrencySymbol.toUpperCase();
    destinationCurrencySymbol = destinationCurrencySymbol.toUpperCase();

    // Try to read exchange rates from DynamoDB cache
    // If cache missed, rebuild cache from the remote API
    let cacheHit = true;
    let currencyExchangeRate = await fetchExchangeRatesFromCache(sourceCurrencySymbol);
    if (currencyExchangeRate === null) {
        cacheHit = false;
        currencyExchangeRate = await fetchExchangeRateFromRemoteApi(sourceCurrencySymbol);
        await putExchangeRatesInCache(currencyExchangeRate);
    }

    // Prepare lambda response
    const lambdaResponse = {
        rate: currencyExchangeRate.rates[destinationCurrencySymbol],
        lastUpdateDate: currencyExchangeRate.lastUpdateDate,
        responseType: cacheHit ? "cached" : "fresh"
    }

    // Return response to the user
    return {
        statusCode: 200,
        body: JSON.stringify(lambdaResponse),
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
    };
};
