import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import apiRoutes from "./routes/index";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import morgan from "morgan";
import cors from "cors";
import { corsOptions, generalLimiter, helmetConfig } from "./config/security";

const app = express();

// Security: Helmet - Set security headers
app.use(helmetConfig);

// Security: CORS - Configure CORS với whitelist từ .env
app.use(cors(corsOptions));

// Body parser với giới hạn kích thước
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan("dev"));

// Security: Rate Limiting - Áp dụng cho tất cả routes
app.use("/api", generalLimiter);

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("Hello World");
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Caro Game API Documentation",
}));

// Swagger JSON endpoint
app.get("/api-docs.json", (req: express.Request, res: express.Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Mount API routes
app.use("/api", apiRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
