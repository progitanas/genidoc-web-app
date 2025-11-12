// backend/src/routes/appointmentRoutes.ts

import { Router } from "express";
import {
  getAppointments,
  getAppointment,
  createAppointment,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from "../controllers/appointmentController";
import { authenticateToken, isPatient, isDoctor } from "../middleware/auth";

const router = Router();

// All appointment routes require authentication
router.use(authenticateToken);

// Get all appointments
router.get("/", getAppointments);

// Get specific appointment
router.get("/:id", getAppointment);

// Create appointment (patients only)
router.post("/", isPatient, createAppointment);

// Confirm appointment (doctors only)
router.post("/:id/confirm", isDoctor, confirmAppointment);

// Cancel appointment
router.post("/:id/cancel", cancelAppointment);

// Reschedule appointment
router.post("/:id/reschedule", rescheduleAppointment);

export default router;
