"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function fetchJSON<T>(url: string): Promise<T> {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  });
}

function buildUrl(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

function useMut<T>(url: string, method: string, keys: string[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: T) => {
      const res = await fetch(url, {
        method,
        ...(method !== "DELETE" && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
  });
}

function useMutWithId<T>(basePath: string, method: string, keys: string[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: T & { id: string }) => {
      const { id, ...data } = input as Record<string, unknown> & { id: string };
      const res = await fetch(`${basePath}/${id}`, {
        method,
        ...(method !== "DELETE" && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
  });
}

function useDelById(basePath: string, keys: string[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${basePath}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
  });
}

// ==================== RESTAURANTS ====================
// Schema field is `title` (matches Prisma model). Frontend used to call it
// `name` which produced empty rows + a 0-restaurants display.
export interface Restaurant {
  id: string;
  title: string;
  slug: string;
  capacity: number;
  depositPerGuest: number;
  operatingDays: number[];
  active: boolean;
  description: string | null;
  createdAt: string;
  _count?: { shifts: number; closures: number; bookings: number };
}

export function useRestaurants(active?: boolean) {
  const url = buildUrl("/api/restaurant/venues", {
    active: active !== undefined ? String(active) : undefined,
  });
  return useQuery<{ restaurants: Restaurant[] }>({
    queryKey: ["restaurants", active],
    queryFn: () => fetchJSON(url),
  });
}

export function useRestaurant(id: string) {
  return useQuery<{ restaurant: Restaurant }>({
    queryKey: ["restaurant", id],
    queryFn: () => fetchJSON(`/api/restaurant/venues/${id}`),
    enabled: !!id,
  });
}

type CreateRestaurantInput = {
  title: string; slug?: string; capacity: number; depositPerGuest: number;
  operatingDays: number[]; description?: string | null; active?: boolean;
};
type UpdateRestaurantInput = {
  id: string; title?: string; slug?: string; capacity?: number;
  depositPerGuest?: number; operatingDays?: number[];
  description?: string | null; active?: boolean;
};

const restKeys = [["restaurants"]];
export const useCreateRestaurant = () => useMut<CreateRestaurantInput>("/api/restaurant/venues", "POST", restKeys);
export const useUpdateRestaurant = () => useMutWithId<UpdateRestaurantInput>("/api/restaurant/venues", "PATCH", restKeys);
export const useDeleteRestaurant = () => useDelById("/api/restaurant/venues", restKeys);

// ==================== SHIFTS ====================
export interface Shift {
  id: string;
  restaurantId: string;
  name: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  slotDuration: number;
  restaurant?: { title: string };
}

export function useShifts(restaurantId?: string) {
  const url = buildUrl("/api/restaurant/shifts", { restaurantId });
  return useQuery<{ shifts: Shift[] }>({
    queryKey: ["restaurantShifts", restaurantId],
    queryFn: () => fetchJSON(url),
  });
}

type CreateShiftInput = {
  restaurantId: string; name: string; startTime: string;
  endTime: string; maxCapacity: number; slotDuration: number;
};
type UpdateShiftInput = {
  id: string; name?: string; startTime?: string; endTime?: string;
  maxCapacity?: number; slotDuration?: number;
};

const shiftKeys = [["restaurantShifts"]];
export const useCreateShift = () => useMut<CreateShiftInput>("/api/restaurant/shifts", "POST", shiftKeys);
export const useUpdateShift = () => useMutWithId<UpdateShiftInput>("/api/restaurant/shifts", "PATCH", shiftKeys);
export const useDeleteShift = () => useDelById("/api/restaurant/shifts", shiftKeys);

// ==================== CLOSURES ====================
export interface Closure {
  id: string;
  restaurantId: string;
  date: string;
  reason: string;
  restaurant?: { title: string };
}

export function useClosures(restaurantId?: string, from?: string, to?: string) {
  const url = buildUrl("/api/restaurant/closures", { restaurantId, from, to });
  return useQuery<{ closures: Closure[] }>({
    queryKey: ["restaurantClosures", restaurantId, from, to],
    queryFn: () => fetchJSON(url),
  });
}

type CreateClosureInput = { restaurantId: string; date: string; reason: string };
const closureKeys = [["restaurantClosures"]];
export const useCreateClosure = () => useMut<CreateClosureInput>("/api/restaurant/closures", "POST", closureKeys);
export const useDeleteClosure = () => useDelById("/api/restaurant/closures", closureKeys);

// ==================== BOOKINGS ====================
// API returns `restaurant: { id, title }` and `client: { id, name, email }`
// (see /api/restaurant/bookings include). Deposit amount is computed from
// the restaurant's depositPerGuest × guestCount on the client side.
export interface RestaurantBooking {
  id: string;
  restaurantId: string;
  clientId: string | null;
  date: string;
  time: string;
  guestCount: number;
  status: "confirmed" | "cancelled" | "no_show";
  depositStatus: "pending" | "paid";
  specialRequests: string | null;
  operationalNotes: string | null;
  restaurant?: { id: string; title: string; depositPerGuest?: number };
  client?: { id: string; name: string; email: string | null; phone?: string | null } | null;
  createdAt: string;
}

export function useRestaurantBookings(
  restaurantId?: string, date?: string, status?: string
) {
  const url = buildUrl("/api/restaurant/bookings", { restaurantId, date, status });
  return useQuery<{ bookings: RestaurantBooking[] }>({
    queryKey: ["restaurantBookings", restaurantId, date, status],
    queryFn: () => fetchJSON(url),
  });
}

type CreateBookingInput = {
  restaurantId: string; date: string; time: string; guestCount: number;
  clientName: string; clientEmail?: string | null; clientPhone?: string | null;
  specialRequests?: string | null;
};
type UpdateBookingInput = {
  id: string; status?: string; depositStatus?: string;
  guestCount?: number; time?: string; specialRequests?: string | null;
  operationalNotes?: string | null;
};

const bookingKeys = [["restaurantBookings"]];
export const useCreateRestaurantBooking = () =>
  useMut<CreateBookingInput>("/api/restaurant/bookings", "POST", bookingKeys);
export const useUpdateRestaurantBooking = () =>
  useMutWithId<UpdateBookingInput>("/api/restaurant/bookings", "PATCH", bookingKeys);
export const useDeleteRestaurantBooking = () =>
  useDelById("/api/restaurant/bookings", bookingKeys);

// ==================== STAFF ====================
export interface RestaurantStaff {
  id: string;
  restaurantId: string;
  userId: string;
  role: "staff" | "manager" | "chef";
  user?: { name: string; email: string };
  restaurant?: { title: string };
  createdAt: string;
}

export function useRestaurantStaff(restaurantId?: string) {
  const url = buildUrl("/api/restaurant/staff", { restaurantId });
  return useQuery<{ staff: RestaurantStaff[] }>({
    queryKey: ["restaurantStaff", restaurantId],
    queryFn: () => fetchJSON(url),
  });
}

type AssignStaffInput = { restaurantId: string; userId: string; role: string };
const staffKeys = [["restaurantStaff"]];
export const useAssignStaff = () => useMut<AssignStaffInput>("/api/restaurant/staff", "POST", staffKeys);
export const useUnassignStaff = () => useDelById("/api/restaurant/staff", staffKeys);

// ==================== DAILY MENU ====================
export interface DailyMenu {
  id: string;
  date: string;
  firstCourse: string;
  secondCourse: string;
  dessert: string;
  price: number;
  active: boolean;
  notes: string | null;
  createdAt: string;
}

export function useDailyMenus(params: { from?: string; to?: string } = {}) {
  const url = buildUrl("/api/restaurant/daily-menu", params);
  return useQuery<{ menus: DailyMenu[] }>({
    queryKey: ["dailyMenus", params],
    queryFn: () => fetchJSON(url),
  });
}

type CreateMenu = {
  date: string; firstCourse: string; secondCourse: string; dessert: string;
  price?: number; active?: boolean; notes?: string | null;
};
type UpdateMenu = Partial<CreateMenu> & { id: string };
const menuKeys = [["dailyMenus"]];
export const useUpsertDailyMenu = () => useMut<CreateMenu>("/api/restaurant/daily-menu", "POST", menuKeys);
export const useUpdateDailyMenu = () => useMutWithId<UpdateMenu>("/api/restaurant/daily-menu", "PATCH", menuKeys);
export const useDeleteDailyMenu = () => useDelById("/api/restaurant/daily-menu", menuKeys);

// ==================== SIMPLE RESERVATIONS ====================
export interface SimpleRestaurantReservation {
  id: string;
  date: string;
  time: string;
  guestCount: number;
  guestName: string;
  guestPhone: string | null;
  guestEmail: string | null;
  notes: string | null;
  status: "confirmada" | "cancelada" | "no_show";
  createdAt: string;
}

export function useSimpleReservations(params: { date?: string; status?: string } = {}) {
  const url = buildUrl("/api/restaurant/reservations", params);
  return useQuery<{ reservations: SimpleRestaurantReservation[] }>({
    queryKey: ["restaurantReservations", params],
    queryFn: () => fetchJSON(url),
  });
}

type CreateRes = {
  date: string; time: string; guestCount: number; guestName: string;
  guestPhone?: string | null; guestEmail?: string | null; notes?: string | null;
  status?: "confirmada" | "cancelada" | "no_show";
};
type UpdateRes = Partial<CreateRes> & { id: string };
const resKeys = [["restaurantReservations"]];
export const useCreateSimpleReservation = () => useMut<CreateRes>("/api/restaurant/reservations", "POST", resKeys);
export const useUpdateSimpleReservation = () => useMutWithId<UpdateRes>("/api/restaurant/reservations", "PATCH", resKeys);
export const useDeleteSimpleReservation = () => useDelById("/api/restaurant/reservations", resKeys);
