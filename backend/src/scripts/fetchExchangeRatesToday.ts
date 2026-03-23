/**
 * Fetch và lưu tỷ giá cho ngày hôm nay (theo logic saveExchangeRates: date = start of local day).
 * Dùng cùng cấu hình với scheduler: EXCHANGE_RATE_API_KEY, EXCHANGE_RATE_API_PROVIDER, EXCHANGE_RATE_BASE_CURRENCY.
 *
 * Chạy: npm run fetch:exchange-rates-today
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/database";
import { updateExchangeRates } from "../services/exchangeRate.service";

async function main() {
  await connectDB();
  const base = (process.env.EXCHANGE_RATE_BASE_CURRENCY || "USD").toUpperCase();
  console.log(`[fetch-exchange-rates-today] Base currency: ${base}`);
  const result = await updateExchangeRates(base);
  if (!result.success) {
    console.error(`[fetch-exchange-rates-today] ${result.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`[fetch-exchange-rates-today] ${result.message} (saved: ${result.savedCount})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(process.exitCode ?? 0);
  });
