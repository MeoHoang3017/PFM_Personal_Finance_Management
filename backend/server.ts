
import { createServer } from "http";
import app from "./src/app";
import { connectDB } from "./src/config/database";
import { connectRedis } from "./src/config/redis";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;

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
  console.log(`Server is running on port ${PORT}`);
  console.log(`Allowed Origins: ${getAllowedOrigins().join(', ')}`);
  try {
    await connectDB();
    console.log("Connected to Database successfully.");
    
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


