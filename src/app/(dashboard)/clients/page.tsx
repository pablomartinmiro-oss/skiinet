"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  type Client,
} from "@/hooks/useClients";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClientModal, DeleteConfirm } from "./_components/ClientModal";
import { ClientDrawer } from "./_components/ClientDrawer";
import { ClientFiltersBar } from "./_components/ClientFilters";
import { StatsCards } from "./_components/StatsCards";
import { exportClientsCSV } from "./_components/csv";
import { skiLevelMeta, stationLabel } from "./_components/constants";
import { toast } from "sonner";
import { Plus, Download, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";

const EUR = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [skiLevel, setSkiLevel] = useState("");
  const [station, setStation] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, skiLevel, station, source]);

  const { data, isLoading } = useClients({
    search: debouncedSearch,
    skiLevel,
    station,
    source,
    page,
    limit: 25,
  });
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const clients = useMemo(() => data?.clients ?? [], [data]);
  const pagination = data?.pagination;

  // Keep drawer client in sync when underlying list refetches
  useEffect(() => {
    if (!drawerClient) return;
    const refreshed = clients.find((c) => c.id === drawerClient.id);
    if (refreshed && refreshed !== drawerClient) setDrawerClient(refreshed);
  }, [clients, drawerClient]);

  function handleCreate(formData: Partial<Client>) {
    createClient.mutate(formData, {
      onSuccess: () => {
        toast.success("Cliente creado");
        setCreateOpen(false);
      },
      onError: () => toast.error("Error al crear cliente"),
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    deleteClient.mutate(targetId, {
      onSuccess: () => {
        toast.success("Cliente eliminado");
        setDeleteTarget(null);
        if (drawerClient?.id === targetId) setDrawerClient(null);
      },
      onError: () => toast.error("Error al eliminar cliente"),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Clientes</h1>
          <p className="text-sm text-[#8A8580]">
            {pagination ? `${pagination.total} clientes registrados` : "Cargando..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportClientsCSV(clients)}
            disabled={clients.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#E87B5A] text-white hover:bg-[#D56E4F]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      <StatsCards stats={data?.stats} />

      <ClientFiltersBar
        search={search}
        skiLevel={skiLevel}
        station={station}
        source={source}
        onSearch={setSearch}
        onSkiLevel={setSkiLevel}
        onStation={setStation}
        onSource={setSource}
      />

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4DE]">
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Tel.</Th>
                <Th>Nivel</Th>
                <Th>Estación</Th>
                <Th right>Gasto Total</Th>
                <Th>Última Visita</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E8E4DE]/50">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <UserCheck className="mx-auto h-8 w-8 text-[#E8E4DE] mb-2" />
                    <p className="text-sm text-[#8A8580]">
                      {debouncedSearch || skiLevel || station || source
                        ? "Sin resultados para los filtros aplicados"
                        : "No hay clientes registrados"}
                    </p>
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDrawerClient(c)}
                    className="cursor-pointer border-b border-[#E8E4DE]/50 hover:bg-[#FAF9F7] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#2D2A26]">{c.name}</td>
                    <td className="px-4 py-3 text-[#8A8580]">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-[#8A8580]">{c.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {c.skiLevel ? (
                        <SkiPill level={c.skiLevel} />
                      ) : (
                        <span className="text-[#8A8580]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#8A8580]">
                      {stationLabel(c.preferredStation)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[#2D2A26]">
                      {EUR.format(c.totalSpent / 100)}
                    </td>
                    <td className="px-4 py-3 text-[#8A8580]">{formatDate(c.lastVisit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E8E4DE] px-4 py-3">
            <p className="text-xs text-[#8A8580]">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {createOpen && (
        <ClientModal
          client={null}
          onClose={() => setCreateOpen(false)}
          onSave={handleCreate}
          saving={createClient.isPending}
        />
      )}

      <ClientDrawer
        client={drawerClient}
        onClose={() => setDrawerClient(null)}
        onDelete={(c) => setDeleteTarget(c)}
      />

      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleteClient.isPending}
        />
      )}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-[#8A8580] uppercase tracking-wider ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function SkiPill({ level }: { level: string }) {
  const meta = skiLevelMeta(level);
  if (!meta) return <span className="text-[#8A8580]">—</span>;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}
