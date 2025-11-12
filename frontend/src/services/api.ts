// src/services/api.ts

import axios, { AxiosInstance, AxiosError } from "axios";
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
} from "@/types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

class ApiService {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Retrieve token from localStorage on initialization
    this.token = localStorage.getItem("token");

    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/auth";
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("token");
  }

  // ============ AUTH ENDPOINTS ============

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.instance.post<AuthResponse>(
        "/auth/login",
        credentials
      );
      if (response.data.token) {
        this.setToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await this.instance.post<AuthResponse>(
        "/auth/register",
        credentials
      );
      if (response.data.token) {
        this.setToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.instance.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearToken();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await this.instance.post<AuthResponse>("/auth/refresh");
      if (response.data.token) {
        this.setToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyEmail(token: string): Promise<ApiResponse<null>> {
    try {
      const response = await this.instance.post<ApiResponse<null>>(
        "/auth/verify-email",
        { token }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<null>> {
    try {
      const response = await this.instance.post<ApiResponse<null>>(
        "/auth/forgot-password",
        { email }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<null>> {
    try {
      const response = await this.instance.post<ApiResponse<null>>(
        "/auth/reset-password",
        {
          token,
          newPassword,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============ APPOINTMENTS ENDPOINTS ============

  async getAppointments(filters?: any): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.instance.get<ApiResponse<any[]>>(
        "/appointments",
        { params: filters }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAppointment(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.get<ApiResponse<any>>(
        `/appointments/${id}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAppointment(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.post<ApiResponse<any>>(
        "/appointments",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAppointment(id: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.put<ApiResponse<any>>(
        `/appointments/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancelAppointment(
    id: string,
    reason: string
  ): Promise<ApiResponse<null>> {
    try {
      const response = await this.instance.post<ApiResponse<null>>(
        `/appointments/${id}/cancel`,
        { reason }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async rescheduleAppointment(
    id: string,
    newDateTime: Date
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.post<ApiResponse<any>>(
        `/appointments/${id}/reschedule`,
        {
          newDateTime,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============ DOCTORS ENDPOINTS ============

  async getDoctors(filters?: any): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.instance.get<ApiResponse<any[]>>("/doctors", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDoctor(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.get<ApiResponse<any>>(
        `/doctors/${id}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDoctorSchedule(doctorId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.instance.get<ApiResponse<any[]>>(
        `/doctors/${doctorId}/schedule`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateDoctorProfile(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.put<ApiResponse<any>>(
        "/doctors/profile",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============ PATIENTS ENDPOINTS ============

  async getPatientProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.get<ApiResponse<any>>(
        "/patients/profile"
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePatientProfile(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.put<ApiResponse<any>>(
        "/patients/profile",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============ PAYMENTS ENDPOINTS ============

  async createPaymentIntent(appointmentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.post<ApiResponse<any>>(
        "/payments/create-intent",
        {
          appointmentId,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.post<ApiResponse<any>>(
        "/payments/confirm",
        {
          paymentIntentId,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPayments(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.instance.get<ApiResponse<any[]>>("/payments");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getInvoice(paymentId: string): Promise<Blob> {
    try {
      const response = await this.instance.get(
        `/payments/${paymentId}/invoice`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============ NOTIFICATIONS ENDPOINTS ============

  async getNotifications(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.instance.get<ApiResponse<any[]>>(
        "/notifications"
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await this.instance.put<ApiResponse<null>>(
        `/notifications/${id}/read`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============ ANALYTICS ENDPOINTS (Admin) ============

  async getAnalytics(dateRange?: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.get<ApiResponse<any>>(
        "/admin/analytics",
        { params: dateRange }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getStats(): Promise<ApiResponse<any>> {
    try {
      const response = await this.instance.get<ApiResponse<any>>(
        "/admin/stats"
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============ ERROR HANDLING ============

  private handleError(error: any): string {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message || error.message || "An error occurred"
      );
    }
    return error.message || "An unknown error occurred";
  }
}

export const apiService = new ApiService();
