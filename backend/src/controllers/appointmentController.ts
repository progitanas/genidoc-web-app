// backend/src/controllers/appointmentController.ts

import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

const generateAppointmentNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(4, "0");
  return `APT-${timestamp}${random}`;
};

export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { status, doctorId, patientId, startDate, endDate } = req.query;
    const userId = req.userId;

    const where: any = {};

    // Filter by user role
    if (req.user?.role === "PATIENT") {
      where.patientId = req.user.patient?.id;
    } else if (req.user?.role === "DOCTOR") {
      where.doctorId = req.user.doctor?.id;
    }

    // Additional filters
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    if (startDate || endDate) {
      where.scheduledDateTime = {};
      if (startDate)
        where.scheduledDateTime.gte = new Date(startDate as string);
      if (endDate) where.scheduledDateTime.lte = new Date(endDate as string);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
        payment: true,
        consultation: true,
        feedback: true,
      },
      orderBy: { scheduledDateTime: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Appointments retrieved",
      data: appointments,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch appointments",
    });
  }
};

export const getAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: true },
        },
        doctor: {
          include: { user: true },
        },
        payment: true,
        consultation: true,
        feedback: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment retrieved",
      data: appointment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch appointment",
    });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      doctorId,
      appointmentType,
      scheduledDateTime,
      symptoms,
      medicalHistory,
      notes,
    } = req.body;

    if (!doctorId || !appointmentType || !scheduledDateTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Get patient
    const patient = await prisma.patient.findUnique({
      where: { userId: req.userId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    // Check doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber: generateAppointmentNumber(),
        patientId: patient.id,
        doctorId,
        userId: req.userId!,
        appointmentType,
        status: "PENDING",
        scheduledDateTime: new Date(scheduledDateTime),
        symptoms,
        medicalHistory,
        notes,
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    // Send notifications
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        type: "APPOINTMENT_CONFIRMATION",
        title: "New Appointment Request",
        message: `New appointment request from ${patient.user.firstName} ${patient.user.lastName}`,
        actionUrl: `/appointments/${appointment.id}`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: req.userId!,
        type: "APPOINTMENT_CONFIRMATION",
        title: "Appointment Created",
        message:
          "Your appointment has been created and is pending confirmation",
        actionUrl: `/appointments/${appointment.id}`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create appointment",
    });
  }
};

export const confirmAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Only doctor can confirm
    if (appointment.doctorId !== req.user?.doctor?.id) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned doctor can confirm this appointment",
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    // Notify patient
    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: "APPOINTMENT_CONFIRMATION",
        title: "Appointment Confirmed",
        message: `Your appointment with ${appointment.doctor.user.firstName} has been confirmed`,
        actionUrl: `/appointments/${id}`,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Appointment confirmed",
      data: updatedAppointment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm appointment",
    });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledBy: req.user?.role,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });

    // Notify both parties
    const otherUserId =
      req.userId === appointment.patient.userId
        ? appointment.doctor.userId
        : appointment.patient.userId;

    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: "APPOINTMENT_CANCELLATION",
        title: "Appointment Cancelled",
        message: `The appointment has been cancelled. Reason: ${reason}`,
        actionUrl: `/appointments/${id}`,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled",
      data: updatedAppointment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel appointment",
    });
  }
};

export const rescheduleAppointment = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { newDateTime } = req.body;

    if (!newDateTime) {
      return res.status(400).json({
        success: false,
        message: "New date/time required",
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        scheduledDateTime: new Date(newDateTime),
        status: "RESCHEDULED",
      },
    });

    // Notify both parties
    await prisma.notification.create({
      data: {
        userId: appointment.doctor.userId,
        type: "APPOINTMENT_CONFIRMATION",
        title: "Appointment Rescheduled",
        message: "An appointment has been rescheduled",
        actionUrl: `/appointments/${id}`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: "APPOINTMENT_CONFIRMATION",
        title: "Appointment Rescheduled",
        message: "Your appointment has been rescheduled",
        actionUrl: `/appointments/${id}`,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Appointment rescheduled",
      data: updatedAppointment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reschedule appointment",
    });
  }
};
