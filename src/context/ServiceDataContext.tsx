"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  STATUS_MAP,
  type WorkOrderItem,
  type Customer,
  type WorkOrderStatus,
  type WorkOrderPriority,
} from "@/mocks/service-data";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
}

export interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface CreateWorkOrderInput {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deviceType: "Telefon" | "Bilgisayar" | "Tablet" | "Diğer";
  deviceModel: string;
  deviceSerial?: string;
  screenPasscode?: string;
  issueSummary: string;
  physicalCondition?: string;
  priority: WorkOrderPriority;
  technicianName: string;
  estimatedCompletion: string;
  estimatedPrice: number;
  paidAmount: number;
}

export interface ServiceDataMetrics {
  totalOrders: number;
  inProgressCount: number;
  pendingApprovalCount: number;
  waitingPartsCount: number;
  readyCount: number;
  todayUrgentCount: number;
  totalCustomers: number;
}

interface ServiceDataContextType {
  // Data
  workOrders: WorkOrderItem[];
  customers: Customer[];
  isLoaded: boolean;
  metrics: ServiceDataMetrics;
  // Auth
  user: AuthenticatedUser | null;
  organization: ActiveOrganization | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    organizationName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  getWorkOrder: (id: string) => WorkOrderItem | undefined;
  getCustomer: (id: string) => Customer | undefined;
  getCustomerOrders: (customerId: string) => WorkOrderItem[];
  createWorkOrder: (input: CreateWorkOrderInput) => Promise<WorkOrderItem>;
  updateWorkOrderStatus: (
    orderId: string,
    newStatus: WorkOrderStatus,
    note?: string,
    actor?: string,
  ) => Promise<void>;
  addWorkOrderNote: (orderId: string, content: string, author?: string) => Promise<void>;
  resetDemoData: () => void;
}

const ServiceDataContext = createContext<ServiceDataContextType | undefined>(undefined);

export const ServiceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [organization, setOrganization] = useState<ActiveOrganization | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<ServiceDataMetrics>({
    totalOrders: 0,
    inProgressCount: 0,
    pendingApprovalCount: 0,
    waitingPartsCount: 0,
    readyCount: 0,
    todayUrgentCount: 0,
    totalCustomers: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Fetch live data from backend API
  const refreshData = useCallback(async () => {
    try {
      const [ordersRes, customersRes, metricsRes] = await Promise.all([
        apiFetch<WorkOrderItem[]>("/api/work-orders"),
        apiFetch<Customer[]>("/api/customers"),
        apiFetch<ServiceDataMetrics>("/api/work-orders/metrics"),
      ]);

      setWorkOrders(ordersRes || []);
      setCustomers(customersRes || []);
      if (metricsRes) {
        setMetrics(metricsRes);
      }
    } catch (err) {
      console.error("Veri yenilenirken hata oluştu:", err);
    }
  }, []);

  // 2. Initial Auth Verification on Mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const me = await apiFetch<{
          user: AuthenticatedUser;
          organization: ActiveOrganization;
        }>("/api/auth/me");

        if (me && me.user && me.organization) {
          setUser(me.user);
          setOrganization(me.organization);
          setIsAuthenticated(true);
          await refreshData();
        }
      } catch {
        // Not logged in or session expired
        setUser(null);
        setOrganization(null);
        setIsAuthenticated(false);
      } finally {
        setIsAuthLoading(false);
        setIsLoaded(true);
      }
    }

    checkAuth();
  }, [refreshData]);

  // Auth: Login
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<{
        user: AuthenticatedUser;
        organization: ActiveOrganization;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setUser(res.user);
      setOrganization(res.organization);
      setIsAuthenticated(true);
      await refreshData();
    },
    [refreshData],
  );

  // Auth: Register
  const register = useCallback(
    async (data: {
      fullName: string;
      email: string;
      password: string;
      organizationName: string;
      phone?: string;
    }) => {
      const res = await apiFetch<{
        user: AuthenticatedUser;
        organization: ActiveOrganization;
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setUser(res.user);
      setOrganization(res.organization);
      setIsAuthenticated(true);
      await refreshData();
    },
    [refreshData],
  );

  // Auth: Logout
  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    setUser(null);
    setOrganization(null);
    setIsAuthenticated(false);
    setWorkOrders([]);
    setCustomers([]);
  }, []);

  // Getter: getWorkOrder by ID or OrderNumber
  const getWorkOrder = useCallback(
    (id: string): WorkOrderItem | undefined => {
      let decoded = id;
      try {
        decoded = decodeURIComponent(id);
      } catch {
        // Ignore
      }
      return workOrders.find(
        (w) =>
          w.id === id ||
          w.orderNumber === id ||
          w.id === decoded ||
          w.orderNumber === decoded,
      );
    },
    [workOrders],
  );

  // Getter: getCustomer by ID
  const getCustomer = useCallback(
    (id: string): Customer | undefined => {
      return customers.find((c) => c.id === id);
    },
    [customers],
  );

  // Getter: getCustomerOrders by Customer ID
  const getCustomerOrders = useCallback(
    (customerId: string): WorkOrderItem[] => {
      return workOrders.filter((w) => w.customerId === customerId);
    },
    [workOrders],
  );

  // Action: Create Work Order (Real API POST)
  const createWorkOrder = useCallback(
    async (input: CreateWorkOrderInput): Promise<WorkOrderItem> => {
      const created = await apiFetch<WorkOrderItem>("/api/work-orders", {
        method: "POST",
        body: JSON.stringify(input),
      });

      await refreshData();
      return created;
    },
    [refreshData],
  );

  // Action: Update Work Order Status (Real API PATCH)
  const updateWorkOrderStatus = useCallback(
    async (
      orderId: string,
      newStatus: WorkOrderStatus,
      note?: string,
    ): Promise<void> => {
      await apiFetch(`/api/work-orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, note }),
      });

      await refreshData();
    },
    [refreshData],
  );

  // Action: Add Work Order Note (Real API POST)
  const addWorkOrderNote = useCallback(
    async (orderId: string, content: string): Promise<void> => {
      await apiFetch(`/api/work-orders/${orderId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      await refreshData();
    },
    [refreshData],
  );

  const resetDemoData = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const value = useMemo(
    () => ({
      workOrders,
      customers,
      isLoaded,
      metrics,
      user,
      organization,
      isAuthenticated,
      isAuthLoading,
      login,
      register,
      logout,
      refreshData,
      getWorkOrder,
      getCustomer,
      getCustomerOrders,
      createWorkOrder,
      updateWorkOrderStatus,
      addWorkOrderNote,
      resetDemoData,
    }),
    [
      workOrders,
      customers,
      isLoaded,
      metrics,
      user,
      organization,
      isAuthenticated,
      isAuthLoading,
      login,
      register,
      logout,
      refreshData,
      getWorkOrder,
      getCustomer,
      getCustomerOrders,
      createWorkOrder,
      updateWorkOrderStatus,
      addWorkOrderNote,
      resetDemoData,
    ],
  );

  return (
    <ServiceDataContext.Provider value={value}>
      {children}
    </ServiceDataContext.Provider>
  );
};

export const useServiceData = (): ServiceDataContextType => {
  const context = useContext(ServiceDataContext);
  if (!context) {
    throw new Error("useServiceData must be used within a ServiceDataProvider");
  }
  return context;
};
