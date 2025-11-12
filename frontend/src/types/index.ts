// src/types/index.ts

export enum UserRole {
  PATIENT = "PATIENT",
  DOCTOR = "DOCTOR",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum AppointmentType {
  IN_PERSON = "IN_PERSON",
  VIDEO_CONSULTATION = "VIDEO_CONSULTATION",
  PHONE_CONSULTATION = "PHONE_CONSULTATION",
  HOME_VISIT = "HOME_VISIT",
}

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  NO_SHOW = "NO_SHOW",
  RESCHEDULED = "RESCHEDULED",
}

export enum ConsultationFeedbackRating {
  POOR = "POOR",
  FAIR = "FAIR",
  GOOD = "GOOD",
  VERY_GOOD = "VERY_GOOD",
  EXCELLENT = "EXCELLENT",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: string;
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient extends User {
  patient: {
    id: string;
    genidocId: string;
    dateOfBirth?: Date;
    gender?: string;
    bloodType?: string;
    address?: string;
    city?: string;
    country?: string;
    zipCode?: string;
    allergies?: string;
    medicalHistory?: string;
    totalSpent: number;
    totalAppointments: number;
    averageRating: number;
  };
}

export interface Doctor extends User {
  doctor: {
    id: string;
    licenseNumber: string;
    licenseExpiry: Date;
    specialization: string;
    bio?: string;
    experience?: number;
    consultationFee: number;
    followupFee?: number;
    isVerified: boolean;
    rating: number;
    totalRatings: number;
    totalConsultations: number;
    totalEarnings: number;
  };
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledDateTime: Date;
  estimatedDuration: number;
  symptoms?: string;
  medicalHistory?: string;
  meetingLink?: string;
  notes?: string;
  doctorNotes?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  patient?: Patient;
  doctor?: Doctor;
  payment?: Payment;
}

export interface Payment {
  id: string;
  transactionId: string;
  appointmentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  notes?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: any;
  recommendations?: string;
  recordingUrl?: string;
}

export interface ConsultationFeedback {
  id: string;
  appointmentId: string;
  patientId: string;
  rating: ConsultationFeedbackRating;
  comment?: string;
  wouldRecommend: boolean;
  createdAt: Date;
}

export interface DoctorRating {
  id: string;
  doctorId: string;
  patientId: string;
  rating: number;
  review?: string;
  verified: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: User;
  expiresIn?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  slotDuration: number;
  maxSlots: number;
}

export interface Establishment {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
  averageRating: number;
  totalDoctors: number;
}

export interface Specialty {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}
