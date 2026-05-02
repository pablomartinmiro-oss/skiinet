"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function fetchJSON<T>(url: string): Promise<T> {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  });
}

// ==================== MY PROFILE ====================

export function useMyInstructorProfile() {
  return useQuery<{ instructor: Instructor | null; isInstructor: boolean }>({
    queryKey: ["instructor-me"],
    queryFn: () => fetchJSON("/api/instructors/me"),
  });
}

// ==================== TYPES ====================

export interface InstructorUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface InstructorAvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Instructor {
  id: string;
  tenantId: string;
  userId: string;
  tdLevel: string;
  certExpiry: string | null;
  certNumber: string | null;
  disciplines: string[];
  specialties: string[];
  languages: string[];
  maxLevel: string | null;
  hourlyRate: number;
  perStudentBonus: number;
  contractType: string;
  station: string;
  seasonStart: string | null;
  seasonEnd: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: InstructorUser;
  availability?: InstructorAvailabilitySlot[];
}

export interface InstructorFilters {
  station?: string;
  tdLevel?: string;
  language?: string;
  isActive?: string;
}

// ==================== LIST ====================

export function useInstructors(filters?: InstructorFilters) {
  const params = new URLSearchParams();
  if (filters?.station) params.set("station", filters.station);
  if (filters?.tdLevel) params.set("tdLevel", filters.tdLevel);
  if (filters?.language) params.set("language", filters.language);
  if (filters?.isActive !== undefined) params.set("isActive", filters.isActive);
  const qs = params.toString();

  return useQuery<{ instructors: Instructor[] }>({
    queryKey: ["instructors", qs],
    queryFn: () => fetchJSON(`/api/instructors${qs ? `?${qs}` : ""}`),
  });
}

// ==================== SINGLE ====================

export function useInstructor(id: string | null) {
  return useQuery<{ instructor: Instructor }>({
    queryKey: ["instructors", id],
    queryFn: () => fetchJSON(`/api/instructors/${id}`),
    enabled: !!id,
  });
}

// ==================== CREATE ====================

export function useCreateInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      userId: string;
      tdLevel: string;
      disciplines: string[];
      specialties?: string[];
      languages: string[];
      maxLevel?: string | null;
      hourlyRate?: number;
      perStudentBonus?: number;
      contractType?: string;
      station: string;
      seasonStart?: string | null;
      seasonEnd?: string | null;
      certExpiry?: string | null;
      certNumber?: string | null;
      notes?: string | null;
    }) => {
      const res = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instructors"] }),
  });
}

// ==================== UPDATE ====================

export function useUpdateInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/instructors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instructors"] }),
  });
}

// ==================== DELETE ====================

export function useDeleteInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/instructors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["instructors"] }),
  });
}

// ==================== AVAILABILITY ====================

export function useInstructorAvailability(instructorId: string | null) {
  return useQuery<{ slots: InstructorAvailabilitySlot[] }>({
    queryKey: ["instructors", instructorId, "availability"],
    queryFn: () => fetchJSON(`/api/instructors/${instructorId}/availability`),
    enabled: !!instructorId,
  });
}

export function useUpdateAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      instructorId,
      slots,
    }: {
      instructorId: string;
      slots: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isActive?: boolean;
      }>;
    }) => {
      const res = await fetch(`/api/instructors/${instructorId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["instructors", vars.instructorId] });
    },
  });
}

// ==================== TIME ENTRIES ====================

export interface TimeEntry {
  id: string;
  tenantId: string;
  instructorId: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  totalMinutes: number;
  breakMinutes: number;
  netMinutes: number;
  source: string;
  lockedAt: string | null;
  correctionOf: string | null;
  correctionReason: string | null;
  notes: string | null;
  geoLat: number | null;
  geoLon: number | null;
  clockOutLat: number | null;
  clockOutLon: number | null;
  instructor: {
    id: string;
    user: { id: string; name: string | null; email: string };
  };
}

export interface TimeEntryFilters {
  instructorId?: string;
  startDate?: string;
  endDate?: string;
}

export function useTimeEntries(filters?: TimeEntryFilters) {
  const params = new URLSearchParams();
  if (filters?.instructorId) params.set("instructorId", filters.instructorId);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  const qs = params.toString();

  return useQuery<{ entries: TimeEntry[] }>({
    queryKey: ["time-entries", qs],
    queryFn: () => fetchJSON(`/api/instructors/time-entries${qs ? `?${qs}` : ""}`),
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      instructorId: string;
      source?: string;
      geoLat?: number | null;
      geoLon?: number | null;
    }) => {
      const res = await fetch("/api/instructors/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-entries"] }),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      ...data
    }: {
      entryId: string;
      breakMinutes?: number;
      notes?: string | null;
      clockOutLat?: number | null;
      clockOutLon?: number | null;
    }) => {
      const res = await fetch(`/api/instructors/time-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-entries"] }),
  });
}

export function useLockTimeEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      startDate: string;
      endDate: string;
      instructorId?: string;
    }) => {
      const res = await fetch("/api/instructors/time-entries/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-entries"] }),
  });
}

export function useCorrectTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      correctionOf: string;
      correctionReason: string;
      clockIn: string;
      clockOut: string;
      breakMinutes?: number;
    }) => {
      const res = await fetch("/api/instructors/time-entries/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-entries"] }),
  });
}

// ==================== ASSIGNMENTS ====================

export interface Assignment {
  id: string;
  instructorId: string;
  bookingId: string;
  lessonType: string;
  studentCount: number;
  scheduledStart: string;
  scheduledEnd: string;
  hourlyRate: number;
  bonusPerStudent: number;
  surcharge: number;
  surchargeReason: string | null;
  status: string;
  completedAt: string | null;
  notes: string | null;
  instructor: {
    id: string;
    tdLevel: string;
    user: { id: string; name: string | null; email: string };
  };
  booking: {
    id: string;
    activityDate: string;
    status: string;
    reservation: { id: string; clientName: string; clientEmail: string | null };
  };
}

export function useAssignments(filters?: { date?: string; instructorId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.date) params.set("date", filters.date);
  if (filters?.instructorId) params.set("instructorId", filters.instructorId);
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();

  return useQuery<{ assignments: Assignment[] }>({
    queryKey: ["assignments", qs],
    queryFn: () => fetchJSON(`/api/instructors/assignments${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      instructorId: string;
      bookingId: string;
      lessonType: string;
      studentCount?: number;
      scheduledStart: string;
      scheduledEnd: string;
      surcharge?: number;
      surchargeReason?: string | null;
      notes?: string | null;
    }) => {
      const res = await fetch("/api/instructors/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status?: string;
      studentCount?: number;
      notes?: string | null;
    }) => {
      const res = await fetch(`/api/instructors/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/instructors/assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useMatchingInstructors(criteria?: {
  date?: string;
  startTime?: string;
  endTime?: string;
  level?: string;
  language?: string;
  discipline?: string;
  station?: string;
}) {
  const params = new URLSearchParams();
  if (criteria?.date) params.set("date", criteria.date);
  if (criteria?.startTime) params.set("startTime", criteria.startTime);
  if (criteria?.endTime) params.set("endTime", criteria.endTime);
  if (criteria?.level) params.set("level", criteria.level);
  if (criteria?.language) params.set("language", criteria.language);
  if (criteria?.discipline) params.set("discipline", criteria.discipline);
  if (criteria?.station) params.set("station", criteria.station);
  const qs = params.toString();

  return useQuery<{ matches: Array<{ instructor: Instructor; score: number; reasons: string[] }> }>({
    queryKey: ["instructor-matching", qs],
    queryFn: () => fetchJSON(`/api/instructors/matching${qs ? `?${qs}` : ""}`),
    enabled: !!criteria?.date,
  });
}
