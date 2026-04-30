"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRightLeft,
  Mail,
  Phone,
  Building2,
  Tag,
  Clock,
  X,
  Save,
} from "lucide-react";
import { useLead, useUpdateLead, useConvertLead } from "@/hooks/useLeads";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo", color: "bg-blue-500/15 text-blue-400" },
  { value: "contactado", label: "Contactado", color: "bg-yellow-500/15 text-yellow-400" },
  { value: "calificado", label: "Calificado", color: "bg-purple-500/15 text-purple-400" },
  { value: "convertido", label: "Convertido", color: "bg-green-500/15 text-green-400" },
  { value: "perdido", label: "Perdido", color: "bg-red-500/15 text-red-400" },
];

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "web", label: "Web" },
  { value: "import", label: "Importación" },
  { value: "storefront", label: "Storefront" },
  { value: "referral", label: "Referido" },
];

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-500/15 text-green-400"
      : score >= 50
        ? "bg-yellow-500/15 text-yellow-400"
        : "bg-red-500/15 text-red-400";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${color}`}>
      Score: {score}
    </div>
  );
}

interface LeadDetailProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetail({ leadId, open, onOpenChange }: LeadDetailProps) {
  const { data: lead, isLoading } = useLead(leadId);
  const updateMutation = useUpdateLead();
  const convertMutation = useConvertLead();
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [newTag, setNewTag] = useState("");

  if (isLoading || !lead) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          <div className="flex h-full items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Cargando...</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const handleStatusChange = (details: { value: string | null }) => {
    if (!details.value) return;
    updateMutation.mutate(
      { id: leadId, status: details.value },
      { onSuccess: () => toast.success("Estado actualizado") }
    );
  };

  const handleConvert = () => {
    convertMutation.mutate(
      { id: leadId },
      {
        onSuccess: () => {
          toast.success("Lead convertido a presupuesto");
          onOpenChange(false);
        },
        onError: () => toast.error("Error al convertir lead"),
      }
    );
  };

  const handleSaveNotes = () => {
    updateMutation.mutate(
      { id: leadId, notes },
      {
        onSuccess: () => {
          toast.success("Notas guardadas");
          setEditNotes(false);
        },
      }
    );
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const tags = [...(lead.tags || []), newTag.trim()];
    updateMutation.mutate(
      { id: leadId, tags },
      {
        onSuccess: () => {
          setNewTag("");
          toast.success("Tag añadido");
        },
      }
    );
  };

  const handleRemoveTag = (tag: string) => {
    const tags = (lead.tags || []).filter((t: string) => t !== tag);
    updateMutation.mutate(
      { id: leadId, tags },
      { onSuccess: () => toast.success("Tag eliminado") }
    );
  };

  const statusConfig = STATUS_OPTIONS.find((s) => s.value === lead.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{lead.name}</SheetTitle>
            <ScoreBadge score={lead.score} />
          </div>
          {lead.company && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {lead.company}
            </p>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-6 pt-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Contacto
            </h3>
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="hover:underline">
                  {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${lead.phone}`} className="hover:underline">
                  {lead.phone}
                </a>
              </div>
            )}
          </div>

          {/* Status & Source */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <Select value={lead.status} onValueChange={(val: string | null) => { if (val) handleStatusChange({ value: val }); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Origen</label>
              <div className="flex items-center h-9 px-3 rounded-md border text-sm">
                {SOURCE_OPTIONS.find((s) => s.value === lead.source)?.label || lead.source}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {(lead.tags || []).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex gap-1">
                <Input
                  placeholder="Nuevo tag..."
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  className="h-7 w-28 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Notas
              </h3>
              {!editNotes && (
                <Button variant="ghost" size="sm" onClick={() => { setEditNotes(true); setNotes(lead.notes || ""); }}>
                  Editar
                </Button>
              )}
            </div>
            {editNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Añadir notas..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes} disabled={updateMutation.isPending}>
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditNotes(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {lead.notes || "Sin notas"}
              </p>
            )}
          </div>

          {/* Timeline placeholder */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Actividad
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                Creado el {new Date(lead.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              {lead.lastContactedAt && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
                  Último contacto: {new Date(lead.lastContactedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}
              {lead.convertedAt && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  Convertido el {new Date(lead.convertedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}
            </div>
          </div>

          {/* Convert CTA */}
          {lead.status !== "convertido" && (
            <Button
              className="w-full"
              onClick={handleConvert}
              disabled={convertMutation.isPending}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Convertir a Presupuesto
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
