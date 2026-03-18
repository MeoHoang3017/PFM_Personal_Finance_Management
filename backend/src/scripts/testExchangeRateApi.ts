/**
 * Test script: Gọi ExchangeRate-API v6 để kiểm tra API key và URL.
 * Chạy: npx tsx src/scripts/testExchangeRateApi.ts
 * Cần có .env với EXCHANGE_RATE_API_KEY và tùy chọn EXCHANGE_RATE_BASE_CURRENCY (mặc định USD).
 */
import "dotenv/config";
import axios from "axios";

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_CURRENCY = process.env.EXCHANGE_RATE_BASE_CURRENCY || "USD";

async function main() {
  console.log(API_KEY);
  console.log("=== Test ExchangeRate-API v6 ===\n");
  console.log("Example URL format: https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD\n");

  if (!API_KEY || API_KEY.trim() === "") {
    console.error("ERROR: EXCHANGE_RATE_API_KEY is not set in .env");
    process.exit(1);
  }

  const url = `https://v6.exchangerate-api.com/v6/${API_KEY.trim()}/latest/${BASE_CURRENCY}`;
  console.log("Request URL (key hidden):", url.replace(API_KEY, "***"));
  console.log("Base currency:", BASE_CURRENCY);
  console.log("");

  try {
    const { data, status } = await axios.get(url, { timeout: 10000 });
    console.log("HTTP Status:", status);
    console.log("Response result:", data.result);

    if (data.result === "error") {
      console.error("API Error type:", data["error-type"] || "unknown");
      process.exit(1);
    }

    const rates = data.conversion_rates;
    if (!rates || typeof rates !== "object") {
      console.error("ERROR: No conversion_rates in response");
      process.exit(1);
    }

    const count = Object.keys(rates).length;
    console.log("Currencies returned:", count);
    console.log("\nSample rates (USD -> ...):");
    ["USD", "EUR", "GBP", "VND", "JPY"].forEach((code) => {
      if (rates[code] != null) console.log(`  ${BASE_CURRENCY} -> ${code}: ${rates[code]}`);
    });
    console.log("\n=> ExchangeRate-API v6 is working correctly.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Request failed:", message);
    if (axios.isAxiosError(err) && err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
