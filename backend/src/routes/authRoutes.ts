// backend/src/routes/authRoutes.ts

import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/verify-email", verifyEmail);

// Protected routes
router.post("/logout", authenticateToken, logout);

export default router;
