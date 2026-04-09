import { Router } from "express";
import {
    getTutorialByUser,
    upsertTutorial,
    completeTutorialStep,
    completeTutorial,
    resetTutorial
} from "../controllers/tutorial.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getTutorialByUser);
router.put('/', upsertTutorial);
router.post('/step/complete', completeTutorialStep);
router.post('/complete', completeTutorial);
router.post('/reset', resetTutorial);

export default router;

