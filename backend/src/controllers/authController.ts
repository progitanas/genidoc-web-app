// backend/src/controllers/authController.ts

import { Response } from "express";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

const generateGeniDocId = () => {
  const randomNum = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `GD-${randomNum}`;
};

const generateTokens = (userId: string) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: process.env.JWT_EXPIRATION || "24h" }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || "your_refresh_secret",
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d" }
  );

  return { token, refreshToken };
};

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || "PATIENT",
        status: "ACTIVE",
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // If patient, create patient profile
    if (role === "PATIENT" || !role) {
      const genidocId = generateGeniDocId();

      await prisma.patient.create({
        data: {
          userId: user.id,
          genidocId,
        },
      });
    }

    // If doctor, create doctor profile (pending verification)
    if (role === "DOCTOR") {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          licenseNumber: "PENDING",
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          specialization: "OTHER",
          consultationFee: 0,
          isVerified: false,
        },
      });
    }

    // Generate tokens
    const { token, refreshToken } = generateTokens(user.id);

    // Return response
    const userWithoutPassword = {
      ...user,
      password: undefined,
    };

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      refreshToken,
      user: userWithoutPassword,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        doctor: true,
        admin: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is suspended
    if (user.status === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended",
      });
    }

    // Generate tokens
    const { token, refreshToken } = generateTokens(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        resourceType: "User",
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || "",
      },
    });

    const userWithoutPassword = {
      ...user,
      password: undefined,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: userWithoutPassword,
      expiresIn: 24 * 60 * 60,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided",
      });
    }

    // Blacklist token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    ) as any;

    const expiresAt = new Date(decoded.exp * 1000);

    await prisma.blacklistedToken.create({
      data: {
        token,
        userId: decoded.userId,
        expiresAt,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: "LOGOUT",
        resourceType: "User",
        resourceId: decoded.userId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || "",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "your_refresh_secret"
    ) as any;

    const { token: newToken } = generateTokens(decoded.userId);

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      token: newToken,
      expiresIn: 24 * 60 * 60,
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token required",
      });
    }

    // Verify token and update user
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    ) as any;

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isEmailVerified: true },
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: "Email verification failed",
    });
  }
};
