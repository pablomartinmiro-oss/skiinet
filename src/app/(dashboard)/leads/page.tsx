"use client";

import { useState } from "react";
import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { LeadStats } from "./_components/LeadStats";
import { LeadPipeline } from "./_components/LeadPipeline";
import { LeadList } from "./_components/LeadList";
import { LeadForm } from "./_components/LeadForm";
import { LeadDetail } from "./_components/LeadDetail";
import { StageToggle, type ViewMode } from "./_components/StageToggle";

export default function LeadsPage() {
  const [view, setView] = useState<ViewMode>("pipeline");
  const [showForm, setShowForm] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { data } = useLeads();
  const leads = data?.leads ?? [];

  const handleSelect = (lead: Lead) => setSelectedLeadId(lead.id);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        </div>
        <div className="flex items-center gap-3">
          <StageToggle value={view} onChange={setView} />
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <LeadStats />

      {/* Main view */}
      {view === "pipeline" ? (
        <LeadPipeline leads={leads} onSelect={handleSelect} />
      ) : (
        <LeadList leads={leads} onSelect={handleSelect} />
      )}

      {/* Create form dialog */}
      <LeadForm open={showForm} onClose={() => setShowForm(false)} />

      {/* Detail drawer */}
      {selectedLeadId && (
        <LeadDetail
          leadId={selectedLeadId}
          open={!!selectedLeadId}
          onOpenChange={(open) => !open && setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
