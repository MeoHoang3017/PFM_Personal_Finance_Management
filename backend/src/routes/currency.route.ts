import { Router } from "express";
import {
    getAllCurrencies,
    getCurrencyByCode,
    getCurrencyById
} from "../controllers/currency.controller";

const router = Router();

// Public routes (currencies are public data)
router.get('/', getAllCurrencies);
router.get('/code/:code', getCurrencyByCode);
router.get('/:id', getCurrencyById);

export default router;

