
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./src/app";
import { connectDB } from "./src/config/database";
import { connectRedis } from "./src/config/redis";
import { socketAuth } from "./src/socket/socket.middleware";
import { SocketHandler } from "./src/socket/socket.handler";
import { runCleanup } from "./src/utils/room-cleanup";
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

const startServer = async () => {
  await connectDB();

  // Connect to Redis (optional - app will work without it, but caching won't be available)
  if (process.env.REDIS_URL) {
    try {
      await connectRedis();
    } catch (error) {
      console.warn('⚠️  Redis connection failed. App will continue without caching:', error);
      console.warn('   To enable caching, make sure Redis is running and REDIS_URL is set correctly.');
    }
  } else {
    console.log('ℹ️  Redis URL not set. Caching is disabled.');
    console.log('   To enable caching, set REDIS_URL in your .env file (e.g., redis://localhost:6379)');
  }

  // Create HTTP server
  const httpServer = createServer(app);

  // Create Socket.io server với CORS config từ .env
  const allowedOrigins = getAllowedOrigins();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Cho phép requests không có origin trong development
        if (!origin && process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Apply authentication middleware
  io.use(socketAuth);

  // Initialize socket handlers
  new SocketHandler(io);

  httpServer.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 Socket.io server initialized`);
    
    // Run initial cleanup
    await runCleanup();
    
    // Schedule cleanup job to run every hour
    setInterval(async () => {
      await runCleanup();
    }, 60 * 60 * 1000); // 1 hour
    
    console.log(`🧹 Room cleanup job scheduled (runs every hour)`);
  });

  httpServer.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`);
      console.error(`   You can find the process using: netstat -ano | findstr :${PORT}`);
      console.error(`   Then kill it using: taskkill /PID <PID> /F`);
      process.exit(1);
    } else {
      console.error("❌ Server error:", error);
      process.exit(1);
    }
  });
};

startServer();
