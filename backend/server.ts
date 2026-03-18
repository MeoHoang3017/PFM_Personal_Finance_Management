
import { createServer } from "http";
import app from "./src/app";
import { connectDB } from "./src/config/database";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;

/** Log missing required env vars (không dừng server để tránh break dev). */
function validateEnv(): void {
  const required: { key: string; hint?: string }[] = [
    { key: "MONGO_URI", hint: "MongoDB connection string" },
    { key: "ACCESS_TOKEN_SECRET_KEY", hint: "openssl rand -base64 32" },
    { key: "REFRESH_TOKEN_SECRET_KEY", hint: "openssl rand -base64 32" },
  ];
  const optionalForMail: { key: string }[] = [
    { key: "EMAIL_USER" },
    { key: "EMAIL_APP_PASSWORD" },
  ];
  const missing = required.filter(({ key }) => !process.env[key]?.trim());
  const missingMail = optionalForMail.filter(({ key }) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.warn("[env] Missing required variables:", missing.map((m) => m.key).join(", "));
    missing.forEach((m) => m.hint && console.warn(`  - ${m.key}: ${m.hint}`));
  }
  if (missingMail.length > 0 && process.env.NODE_ENV !== "test") {
    console.warn("[env] Email not configured (OTP/reset password will fail):", missingMail.map((m) => m.key).join(", "));
  }
}

// Lấy allowed origins từ environment variable (giống như CORS config)
const getAllowedOrigins = (): string[] => {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.split(',').map(url => url.trim());
  }
  // Fallback cho development
  return ['http://localhost:3000', 'http://localhost:5173'];
};

const server = createServer(app);

server.listen(PORT, async () => {
  validateEnv();
  console.log(`Server is running on port ${PORT}`);
  console.log(`Allowed Origins: ${getAllowedOrigins().join(', ')}`);
  try {
    await connectDB();
    console.log("Connected to Database successfully.");

    // Seed danh mục mặc định (user = null) dùng chung cho tất cả user
    const { runSeedDefaultCategories } = await import("./src/scripts/seedDefaultCategories");
    await runSeedDefaultCategories();

    // Start exchange rate scheduler
    if (process.env.EXCHANGE_RATE_AUTO_UPDATE !== 'false') {
      const { startExchangeRateScheduler } = await import("./src/utils/exchangeRate.scheduler");
      startExchangeRateScheduler();
    } else {
      console.log("Exchange rate auto-update is disabled");
    }
  } catch (error) {
    console.error("Failed to connect to Database", error);
  }
});


