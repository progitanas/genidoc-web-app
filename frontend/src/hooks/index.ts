// src/hooks/useAuth.ts

import { useState, useCallback, useEffect } from "react";
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from "@/types";
import { apiService } from "@/services/api";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        apiService.setToken(token);
      } catch (err) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const response: AuthResponse = await apiService.login(credentials);
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const response: AuthResponse = await apiService.register(credentials);
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiService.logout();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      apiService.clearToken();
    } catch (err: any) {
      const errorMessage = err.message || "Logout failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    setUser,
    setError,
  };
};

// src/hooks/useAppointments.ts

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getAppointments(filters);
      if (response.success) {
        setAppointments(response.data || []);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppointment = useCallback(
    async (data: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.createAppointment(data);
        if (response.success) {
          fetchAppointments();
          return { success: true, data: response.data };
        } else {
          throw new Error(response.message);
        }
      } catch (err: any) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchAppointments]
  );

  const cancelAppointment = useCallback(
    async (id: string, reason: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.cancelAppointment(id, reason);
        if (response.success) {
          fetchAppointments();
          return { success: true };
        } else {
          throw new Error(response.message);
        }
      } catch (err: any) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchAppointments]
  );

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    cancelAppointment,
  };
};

// src/hooks/useDoctors.ts

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getDoctors(filters);
      if (response.success) {
        setDoctors(response.data || []);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDoctorById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getDoctor(id);
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    doctors,
    loading,
    error,
    fetchDoctors,
    getDoctorById,
  };
};

// src/hooks/useNotifications.ts

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotifications();
      if (response.success) {
        setNotifications(response.data || []);
        const unread = (response.data || []).filter(
          (n: any) => !n.isRead
        ).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
  };
};
