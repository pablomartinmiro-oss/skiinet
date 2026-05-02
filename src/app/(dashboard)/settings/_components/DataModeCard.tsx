"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SyncStatus {
  lastFullSync: string | null;
  lastIncrSync: string | null;
  contactCount: number;
  conversationCount: number;
  opportunityCount: number;
  pipelineCount: number;
  syncInProgress: boolean;
}

interface SyncStatusCardProps {
  ghlConnected: boolean;
  loading: boolean;
  syncStatus?: SyncStatus | null;
  syncState?: string | null;
  syncProgressMsg?: string | null;
  lastSyncError?: string | null;
}

export function SyncStatusCard({
  ghlConnected,
  loading,
  syncStatus,
  syncState,
  syncProgressMsg,
  lastSyncError,
}: SyncStatusCardProps) {
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!ghlConnected) {
    return null;
  }

  const lastSync = syncStatus?.lastFullSync ?? syncStatus?.lastIncrSync;
  const isError = syncState === "error";
  const isSyncing = syncStatus?.syncInProgress || syncState === "syncing" || syncing;

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/ghl/full-sync", { method: "POST" });
      if (!res.ok && res.status !== 202) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error de sincronización");
      }
      toast.success("Sincronización iniciada — esto puede tardar unos minutos");

      // Poll sync status every 3 seconds until done
      const pollInterval = setInterval(async () => {
        await queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
      }, 3000);

      // Stop polling after 10 minutes max
      setTimeout(() => {
        clearInterval(pollInterval);
        setSyncing(false);
      }, 600000);

      // Also check periodically if sync is done
      const checkDone = setInterval(async () => {
        const data = queryClient.getQueryData<{ tenant: { syncState: string | null } }>(["tenant-settings"]);
        if (data?.tenant?.syncState && data.tenant.syncState !== "syncing") {
          clearInterval(pollInterval);
          clearInterval(checkDone);
          setSyncing(false);
          if (data.tenant.syncState === "complete") {
            toast.success("Sincronización completa");
          } else if (data.tenant.syncState === "error") {
            toast.error("Error en la sincronización");
          }
        }
      }, 3500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(msg);
      setSyncing(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Sincronización GHL</h2>
            {isError ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-muted-red">
                <AlertTriangle className="h-3 w-3" />
                Error
              </span>
            ) : isSyncing ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                <Loader2 className="h-3 w-3 animate-spin" />
                Sincronizando...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <CheckCircle className="h-3 w-3" />
                Conectado
              </span>
            )}
          </div>

          {isError && lastSyncError && (
            <p className="text-sm text-muted-red">{lastSyncError}</p>
          )}

          {/* Show live progress message while syncing */}
          {isSyncing && syncProgressMsg && (
            <p className="text-sm font-medium text-amber-700">{syncProgressMsg}</p>
          )}

          {syncStatus && (
            <div className="space-y-1 text-xs text-slate-500">
              {lastSync && (
                <p>
                  Última sincronización:{" "}
                  <span className="font-medium text-slate-900">
                    {new Date(lastSync).toLocaleString("es-ES")}
                  </span>
                </p>
              )}
              <p>
                {syncStatus.contactCount.toLocaleString("es-ES")} contactos ·{" "}
                {syncStatus.pipelineCount} pipelines ·{" "}
                {syncStatus.opportunityCount.toLocaleString("es-ES")} oportunidades ·{" "}
                {syncStatus.conversationCount.toLocaleString("es-ES")} conversaciones
              </p>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={isSyncing}
          onClick={handleManualSync}
          className="ml-4 min-w-[160px]"
        >
          {isSyncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sincronizar ahora
        </Button>
      </div>
    </div>
  );
}
