"use client";

import { Building2, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TenantInfoCardProps {
  name: string;
  slug: string;
  createdAt: string;
  loading: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function TenantInfoCard({
  name,
  slug,
  createdAt,
  loading,
}: TenantInfoCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
        <Skeleton className="mt-4 h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h3 className="mb-1 text-base font-semibold text-slate-900">Cuenta</h3>
      <p className="mb-4 text-sm text-slate-500">Información de tu cuenta</p>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-slate-500" />
          <span className="font-medium text-slate-900">{name}</span>
          <span className="text-slate-500">({slug})</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-4 w-4" />
          Creado el {formatDate(createdAt)}
        </div>
      </div>
    </div>
  );
}
