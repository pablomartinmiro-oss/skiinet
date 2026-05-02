"use client";

import { useState, useEffect } from "react";
import { Euro, Save } from "lucide-react";
import { toast } from "sonner";
import {
  useRoomTypes,
  useRoomSeasons,
  useRoomRates,
  useBulkSetRates,
} from "@/hooks/useHotel";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";

const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

interface DayRate {
  dayOfWeek: number;
  price: number;
  supplement: number;
}

function buildEmptyRates(): DayRate[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i + 1,
    price: 0,
    supplement: 0,
  }));
}

export default function RatesTab() {
  const { data: roomData, isLoading: roomsLoading } = useRoomTypes();
  const { data: seasonData, isLoading: seasonsLoading } = useRoomSeasons();

  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [dayRates, setDayRates] = useState<DayRate[]>(buildEmptyRates());

  const { data: ratesData, isLoading: ratesLoading } = useRoomRates(
    selectedRoom || undefined,
    selectedSeason || undefined
  );
  const bulkSet = useBulkSetRates();

  const rooms = roomData?.roomTypes || [];
  const seasons = seasonData?.seasons || [];

  // Populate day rates when fetched data changes
  useEffect(() => {
    if (!ratesData?.rates) {
      setDayRates(buildEmptyRates());
      return;
    }
    const merged = buildEmptyRates().map((day) => {
      const existing = ratesData.rates.find(
        (r) => r.dayOfWeek === day.dayOfWeek
      );
      if (existing) {
        return {
          dayOfWeek: day.dayOfWeek,
          price: existing.price,
          supplement: existing.supplement,
        };
      }
      return day;
    });
    setDayRates(merged);
  }, [ratesData]);

  if (roomsLoading || seasonsLoading) return <PageSkeleton />;

  const handlePriceChange = (dayOfWeek: number, price: number) => {
    setDayRates((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, price } : d))
    );
  };

  const handleSupplementChange = (dayOfWeek: number, supplement: number) => {
    setDayRates((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, supplement } : d
      )
    );
  };

  const handleSave = async () => {
    if (!selectedRoom || !selectedSeason) {
      toast.error("Selecciona tipo de habitación y temporada");
      return;
    }
    try {
      await bulkSet.mutateAsync({
        roomTypeId: selectedRoom,
        seasonId: selectedSeason,
        rates: dayRates,
      });
      toast.success("Tarifas guardadas correctamente");
    } catch {
      toast.error("Error al guardar tarifas");
    }
  };

  const bothSelected = selectedRoom && selectedSeason;
  const fmt = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">
            Tipo de habitación
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
          >
            <option value="">Seleccionar habitación...</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1">
            Temporada
          </label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
          >
            <option value="">Seleccionar temporada...</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!bothSelected && (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-12 text-center">
          <Euro className="mx-auto h-10 w-10 text-[#8A8580] mb-3" />
          <p className="text-sm text-[#8A8580]">
            Selecciona un tipo de habitación y una temporada
          </p>
          <p className="text-xs text-[#8A8580] mt-1">
            Para configurar las tarifas por dia de la semana
          </p>
        </div>
      )}

      {/* Rate matrix */}
      {bothSelected && (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {ratesLoading ? (
            <div className="p-8 text-center text-sm text-[#8A8580]">
              Cargando tarifas...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Dia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Precio (EUR)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Suplemento (EUR)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DE]">
                    {dayRates.map((day) => (
                      <tr
                        key={day.dayOfWeek}
                        className="hover:bg-[#FAF9F7]/30 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <span className="text-sm font-medium text-[#2D2A26]">
                            {DAY_NAMES[day.dayOfWeek - 1]}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={day.price}
                            onChange={(e) =>
                              handlePriceChange(
                                day.dayOfWeek,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-32 rounded-[10px] border border-[#E8E4DE] px-3 py-1.5 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={day.supplement}
                            onChange={(e) =>
                              handleSupplementChange(
                                day.dayOfWeek,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-32 rounded-[10px] border border-[#E8E4DE] px-3 py-1.5 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]"
                          />
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-[#2D2A26]">
                          {fmt.format(day.price + day.supplement)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t border-[#E8E4DE] px-6 py-4">
                <button
                  onClick={handleSave}
                  disabled={bulkSet.isPending}
                  className="flex items-center gap-2 rounded-[10px] bg-[#E87B5A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#D56E4F] disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {bulkSet.isPending ? "Guardando..." : "Guardar tarifas"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
