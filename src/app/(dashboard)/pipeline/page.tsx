"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Kanban, List, Download } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { usePipelines, useOpportunities, useMoveOpportunity } from "@/hooks/useGHL";
import { KanbanSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { GHLEmptyState } from "@/components/shared/GHLEmptyState";
import { KanbanColumn } from "./_components/KanbanColumn";
import { KanbanCard } from "./_components/KanbanCard";
import { PipelineSelector } from "./_components/PipelineSelector";
import { PipelineListView } from "./_components/PipelineListView";
import { OpportunityModal } from "./_components/OpportunityModal";
import { exportToCSV } from "@/lib/utils/export";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GHLOpportunity } from "@/lib/ghl/types";

const VIEW_STORAGE_KEY = "pipeline-view-preference";

type ViewMode = "kanban" | "list";

function getDaysInStage(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

export default function PipelinePage() {
  const { data: pipelineData, isLoading: pipelinesLoading } = usePipelines();
  const pipelines = useMemo(() => pipelineData?.pipelines ?? [], [pipelineData]);

  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  const [activeOpp, setActiveOpp] = useState<GHLOpportunity | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<GHLOpportunity | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Load preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode | null;
      if (saved === "list" || saved === "kanban") {
        setViewMode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  const selectedPipelineId = userSelectedId ?? pipelines[0]?.id ?? null;

  const { data: oppData, isLoading: oppsLoading } =
    useOpportunities(selectedPipelineId);
  const opportunities = useMemo(() => oppData?.opportunities ?? [], [oppData]);
  const moveOpp = useMoveOpportunity();

  const selectedPipeline = useMemo(
    () => pipelines.find((p) => p.id === selectedPipelineId),
    [pipelines, selectedPipelineId]
  );
  const stages = useMemo(
    () => selectedPipeline?.stages ?? [],
    [selectedPipeline]
  );

  const oppsByStage = useMemo(() => {
    const map = new Map<string, typeof opportunities>();
    for (const stage of stages) {
      map.set(
        stage.id,
        opportunities.filter((o) => o.pipelineStageId === stage.id)
      );
    }
    return map;
  }, [stages, opportunities]);

  const totalValue = opportunities.reduce(
    (sum, o) => sum + o.monetaryValue,
    0
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const opp = opportunities.find((o) => o.id === event.active.id);
    setActiveOpp(opp ?? null);
  }, [opportunities]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveOpp(null);
    const { active, over } = event;
    if (!over) return;

    const oppId = active.id as string;
    const newStageId = over.id as string;
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp || opp.pipelineStageId === newStageId) return;

    moveOpp.mutate(
      { id: oppId, stageId: newStageId },
      {
        onSuccess: () => toast.success("Oportunidad movida"),
        onError: () => toast.error("Error al mover la oportunidad"),
      }
    );
  }, [opportunities, moveOpp]);

  const handleExportCSV = useCallback(() => {
    if (!opportunities.length) {
      toast.error("No hay oportunidades para exportar");
      return;
    }
    const stageMap = new Map(stages.map((s) => [s.id, s.name]));
    exportToCSV(
      opportunities.map((o) => ({
        nombre: o.name,
        contacto: o.contactName ?? "",
        valor: o.monetaryValue,
        etapa: stageMap.get(o.pipelineStageId) ?? o.pipelineStageId,
        dias_en_etapa: getDaysInStage(o.createdAt),
        estado: o.status,
      })),
      "pipeline-oportunidades",
      [
        { key: "nombre", label: "Nombre" },
        { key: "contacto", label: "Contacto" },
        { key: "valor", label: "Valor (€)" },
        { key: "etapa", label: "Etapa" },
        { key: "dias_en_etapa", label: "Días en etapa" },
        { key: "estado", label: "Estado" },
      ]
    );
    toast.success("CSV exportado");
  }, [opportunities, stages]);

  const loading = pipelinesLoading || oppsLoading;

  return (
    <GHLEmptyState message="No hay pipelines. Conecta GoHighLevel para ver tus oportunidades.">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pipeline</h1>
          <p className="text-sm text-slate-500">Gestiona tus oportunidades por etapa</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="hidden sm:block text-sm text-slate-500">
              {opportunities.length} oportunidades &middot;{" "}
              {new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 0,
              }).format(totalValue)}
            </span>
          )}
          {/* CSV Export button */}
          {!loading && opportunities.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              title="Exportar CSV"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
          {/* View toggle */}
          {!loading && stages.length > 0 && (
            <div className="flex glass-card overflow-hidden" style={{borderRadius: '8px'}}>
              <button
                onClick={() => handleSetViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-2 text-sm transition-colors",
                  viewMode === "kanban"
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                )}
                title="Vista Kanban"
              >
                <Kanban className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleSetViewMode("list")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-2 text-sm transition-colors border-l border-border",
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                )}
                title="Vista Lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <PipelineSelector
        pipelines={pipelines}
        selectedId={selectedPipelineId}
        onSelect={setUserSelectedId}
      />

      {loading ? (
        <KanbanSkeleton />
      ) : stages.length === 0 ? (
        <EmptyState
          icon={Kanban}
          title="Sin etapas de pipeline"
          description="Las etapas aparecerán aquí una vez sincronizadas desde GHL"
        />
      ) : viewMode === "list" ? (
        <PipelineListView
          stages={stages}
          oppsByStage={oppsByStage}
          onCardClick={setSelectedOpp}
        />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages
              .sort((a, b) => a.position - b.position)
              .map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  opportunities={oppsByStage.get(stage.id) ?? []}
                  onCardClick={setSelectedOpp}
                />
              ))}
          </div>
          <DragOverlay>
            {activeOpp ? <KanbanCard opportunity={activeOpp} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectedOpp && (
        <OpportunityModal
          opportunity={selectedOpp}
          stageName={stages.find((s) => s.id === selectedOpp.pipelineStageId)?.name ?? ""}
          onClose={() => setSelectedOpp(null)}
        />
      )}
    </div>
    </GHLEmptyState>
  );
}
