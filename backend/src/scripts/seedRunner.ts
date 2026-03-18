/**
 * Chạy seed danh mục mặc định độc lập (không cần start server).
 * Cách chạy: npx tsx src/scripts/seedRunner.ts
 * Hoặc: npm run seed (nếu đã thêm script trong package.json)
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/database";
import { runSeedDefaultCategories } from "./seedDefaultCategories";
import { runSeedCurrenciesAndExchangeRates } from "./seedCurrenciesAndExchangeRates";

dotenv.config();

async function main() {
  await connectDB();
  await runSeedDefaultCategories();
  await runSeedCurrenciesAndExchangeRates();
  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});