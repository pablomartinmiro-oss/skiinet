"use client";

import { useState, useMemo } from "react";
import { LayoutList, CalendarDays, ArrowLeft } from "lucide-react";
import { useReservations, useReservationStats } from "@/hooks/useReservations";
import { StatsBar } from "./_components/StatsBar";
import { ReservationList } from "./_components/ReservationList";
import { ReservationForm } from "./_components/ReservationForm";
import { ReservationDetail } from "./_components/ReservationDetail";
import { WeeklyStats } from "./_components/WeeklyStats";
import { VoucherStats } from "./_components/VoucherStats";
import { ReservationCalendar } from "./_components/ReservationCalendar";
import { cn } from "@/lib/utils";

type View = "lista" | "calendario";

function getMonthRange(d: Date) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  return { from, to };
}

export default function ReservasPage() {
  const [view, setView] = useState<View>("lista");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarDate, setCalendarDate] = useState<string | null>(null);

  const { from: monthFrom, to: monthTo } = getMonthRange(calendarMonth);

  // Calendar mode loads by activityDate for the visible month
  const { data: reservationsData, isLoading } = useReservations(
    view === "calendario" ? { dateFrom: monthFrom, dateTo: monthTo, pageSize: 200 } : { pageSize: 50 }
  );
  const reservations = reservationsData?.reservations;
  const { data: stats, isLoading: statsLoading } = useReservationStats();

  const lastReservation = useMemo(() => {
    if (!reservations || reservations.length === 0) return null;
    return reservations[0];
  }, [reservations]);

  const selectedReservation = useMemo(() => {
    if (!selectedId || !reservations) return null;
    return reservations.find((r) => r.id === selectedId) ?? null;
  }, [selectedId, reservations]);

  // Reservations for the selected calendar day
  const dayReservations = useMemo(() => {
    if (!calendarDate || !reservations) return [];
    return reservations.filter((r) => {
      const d = new Date(r.activityDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return key === calendarDate;
    });
  }, [reservations, calendarDate]);

  function handleMonthChange(d: Date) {
    setCalendarMonth(d);
    setCalendarDate(null);
    setSelectedId(null);
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4">
      {/* Live stats bar */}
      <StatsBar stats={stats} loading={statsLoading} />

      {/* Voucher tracking widget */}
      <VoucherStats />

      {/* View toggle */}
      <div className="flex items-center gap-1 self-start rounded-xl border border-[#E8E4DE] bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => { setView("lista"); setCalendarDate(null); }}
          className={cn(
            "flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-sm font-medium transition-colors",
            view === "lista"
              ? "bg-[#E87B5A] text-white shadow-sm"
              : "text-[#8A8580] hover:text-[#2D2A26]"
          )}
        >
          <LayoutList className="h-3.5 w-3.5" />
          Lista
        </button>
        <button
          onClick={() => { setView("calendario"); setSelectedId(null); }}
          className={cn(
            "flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-sm font-medium transition-colors",
            view === "calendario"
              ? "bg-[#E87B5A] text-white shadow-sm"
              : "text-[#8A8580] hover:text-[#2D2A26]"
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Calendario
        </button>
      </div>

      {/* Main two-panel layout */}
      <div className="flex min-h-0 flex-1 gap-0 md:gap-4">
        {view === "lista" ? (
          <>
            {/* Left panel: list */}
            <div className={cn(
              "flex w-full md:w-[35%] flex-col rounded-none md:rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
              selectedId ? "hidden md:flex" : "flex"
            )}>
              <ReservationList
                reservations={reservations}
                loading={isLoading}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
              />
              <WeeklyStats stats={stats} />
            </div>

            {/* Right panel: detail/form */}
            <div className={cn(
              "flex w-full md:w-[65%] flex-col rounded-none md:rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
              selectedId ? "flex" : "hidden md:flex"
            )}>
              {/* Mobile back button */}
              {selectedId && (
                <div className="flex items-center border-b border-border px-3 py-2 md:hidden">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </button>
                </div>
              )}
              {selectedReservation ? (
                <ReservationDetail
                  reservation={selectedReservation}
                  onBack={() => setSelectedId(null)}
                />
              ) : (
                <ReservationForm
                  existingReservations={reservations}
                  lastReservation={lastReservation}
                  onCreated={() => {}}
                />
              )}
            </div>
          </>
        ) : (
          <>
            {/* Left panel: calendar */}
            <div className={cn(
              "flex w-full md:w-[40%] flex-col rounded-none md:rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
              calendarDate ? "hidden md:flex" : "flex"
            )}>
              <ReservationCalendar
                reservations={reservations ?? []}
                month={calendarMonth}
                selectedDate={calendarDate}
                onSelectDate={setCalendarDate}
                onMonthChange={handleMonthChange}
              />
            </div>

            {/* Right panel: day reservations */}
            <div className={cn(
              "flex w-full md:w-[60%] flex-col rounded-none md:rounded-[14px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
              calendarDate ? "flex" : "hidden md:flex"
            )}>
              {calendarDate ? (
                <>
                  {/* Mobile back button for calendar view */}
                  <div className="flex items-center border-b border-border px-3 py-2 md:hidden">
                    <button
                      onClick={() => { setCalendarDate(null); setSelectedId(null); }}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver
                    </button>
                  </div>
                  {selectedReservation ? (
                    <ReservationDetail
                      reservation={selectedReservation}
                      onBack={() => setSelectedId(null)}
                    />
                  ) : (
                    <ReservationList
                      reservations={dayReservations}
                      loading={isLoading}
                      selectedId={selectedId}
                      onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                      emptyLabel={`Sin reservas el ${calendarDate}`}
                    />
                  )}
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[#8A8580]">
                  <CalendarDays className="h-10 w-10 opacity-25" />
                  <p className="text-sm">Selecciona un día para ver sus reservas</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
