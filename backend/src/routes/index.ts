import { Router } from "express";
import authRoutes from "./auth.route";
import otpRoutes from "./otp.route";
import userRoutes from "./user.route";
import walletRoutes from "./wallet.route";
import transactionRoutes from "./transaction.route";
import categoryRoutes from "./category.route";
import goalRoutes from "./goal.route";
import budgetRoutes from "./budget.route";
import currencyRoutes from "./currency.route";
import notificationRoutes from "./notification.route";
import tutorialRoutes from "./tutorial.route";
import exchangeRateRoutes from "./exchangeRate.route";

const router = Router();

// Health check (không cần auth) - dùng để kiểm tra frontend kết nối backend
router.get("/health", (req, res) => {
  res.json({ ok: true, message: "API is running" });
});

// Mount route handlers
router.use("/auth", authRoutes);
router.use("/otp", otpRoutes);
router.use("/users", userRoutes);
router.use("/wallets", walletRoutes);
router.use("/transactions", transactionRoutes);
router.use("/categories", categoryRoutes);
router.use("/goals", goalRoutes);
router.use("/budgets", budgetRoutes);
router.use("/currencies", currencyRoutes);
router.use("/notifications", notificationRoutes);
router.use("/tutorial", tutorialRoutes);
router.use("/exchange-rates", exchangeRateRoutes);

export default router;