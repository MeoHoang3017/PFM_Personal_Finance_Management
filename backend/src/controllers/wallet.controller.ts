import { Request, Response, NextFunction } from "express";
import {
    getUserWalletsService,
    getWalletByIdService,
    createWalletService,
    updateWalletService,
    deleteWalletService
} from "../services/wallet.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Get user wallets with pagination
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of wallets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Wallet'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
export const getUserWallets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const result = await getUserWalletsService(userId, page, pageSize);
        sendResponse(res, SuccessResponse.LIST('Wallets', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to fetch wallets', 500));
    }
};

/**
 * @swagger
 * /api/wallets/{id}:
 *   get:
 *     summary: Get wallet by ID
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Wallet'
 */
export const getWalletById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }
        const { id } = req.params;
        const result = await getWalletByIdService(id as string, userId);
        sendResponse(res, SuccessResponse.ITEM('Wallet', result));
    } catch (error: any) {
        next(createError(error.message || 'Wallet not found', 404));
    }
};

/**
 * @swagger
 * /api/wallets:
 *   post:
 *     summary: Create a new wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWalletRequest'
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Wallet'
 */
export const createWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }

        const { name, balance } = req.body;

        if (!name) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['name']));
            return;
        }

        const result = await createWalletService({
            name,
            balance,
            user: userId
        });

        sendResponse(res, SuccessResponse.CREATED('Wallet', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to create wallet', 400));
    }
};

/**
 * @swagger
 * /api/wallets/{id}:
 *   put:
 *     summary: Update wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWalletRequest'
 *     responses:
 *       200:
 *         description: Wallet updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/Wallet'
 */
export const updateWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }
        const { id } = req.params;
        const { name, balance } = req.body;

        const result = await updateWalletService(id as string, { name, balance }, userId);
        sendResponse(res, SuccessResponse.UPDATED('Wallet', result));
    } catch (error: any) {
        next(createError(error.message || 'Failed to update wallet', 400));
    }
};

/**
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: Delete wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   nullable: true
 */
export const deleteWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            sendResponse(res, ErrorResponse.UNAUTHORIZED);
            return;
        }
        const { id } = req.params;
        await deleteWalletService(id as string, userId);
        sendResponse(res, SuccessResponse.DELETED('Wallet'));
    } catch (error: any) {
        next(createError(error.message || 'Failed to delete wallet', 500));
    }
};

