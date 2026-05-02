"use client";

import { useState } from "react";
import {
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Review } from "@/hooks/useReviews";
import { useUpdateReview, useDeleteReview } from "@/hooks/useReviews";
import ReplyModal from "./ReplyModal";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Pendiente",
    cls: "bg-[#D4A853]/15 text-[#D4A853]",
  },
  approved: {
    label: "Aprobada",
    cls: "bg-[#5B8C6D]/15 text-[#5B8C6D]",
  },
  rejected: {
    label: "Rechazada",
    cls: "bg-[#C75D4A]/15 text-[#C75D4A]",
  },
};

const ENTITY_LABELS: Record<string, string> = {
  experience: "Experiencia",
  hotel: "Hotel",
  spa: "Spa",
  restaurant: "Restaurante",
};

function StarRating({ rating }: { rating: number }) {
  // Coerce defensively in case the API returns a string or null
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < r
                ? "fill-[#D4A853] text-[#D4A853]"
                : "text-[#E8E4DE]"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-[#2D2A26] tabular-nums">
        {r > 0 ? r.toFixed(1) : "—"}
      </span>
    </div>
  );
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function ReviewsTable({ reviews }: { reviews: Review[] }) {
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const [replyingTo, setReplyingTo] = useState<Review | null>(null);

  const handleApprove = async (r: Review) => {
    try {
      await updateReview.mutateAsync({ id: r.id, status: "approved" });
      toast.success("Reseña aprobada");
    } catch {
      toast.error("Error al aprobar reseña");
    }
  };

  const handleReject = async (r: Review) => {
    try {
      await updateReview.mutateAsync({ id: r.id, status: "rejected" });
      toast.success("Reseña rechazada");
    } catch {
      toast.error("Error al rechazar reseña");
    }
  };

  const handleDelete = async (r: Review) => {
    if (!confirm(`Eliminar la reseña de "${r.authorName}"?`)) return;
    try {
      await deleteReview.mutateAsync(r.id);
      toast.success("Reseña eliminada");
    } catch {
      toast.error("Error al eliminar reseña");
    }
  };

  return (
    <>
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E4DE] bg-[#FAF9F7]/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Autor
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Puntuación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Contenido
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#8A8580] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DE]">
              {reviews.map((r) => {
                const sts = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-[#FAF9F7]/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-sm text-[#2D2A26]">
                          {r.authorName}
                        </span>
                        {r.authorEmail && (
                          <p className="text-xs text-[#8A8580]">
                            {r.authorEmail}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <StarRating rating={r.rating} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-[6px] bg-[#FAF9F7] px-2 py-0.5 text-xs font-medium text-[#8A8580]">
                        {ENTITY_LABELS[r.entityType] ?? r.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {r.title && (
                        <p className="text-sm font-medium text-[#2D2A26] truncate">
                          {r.title}
                        </p>
                      )}
                      <p className="text-xs text-[#8A8580] truncate">
                        {r.body}
                      </p>
                      {r.reply && (
                        <p className="text-xs text-[#5B8C6D] mt-1 truncate">
                          Respuesta: {r.reply}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-[6px] px-2 py-0.5 text-xs font-medium ${sts.cls}`}
                      >
                        {sts.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-[#8A8580]">
                      {fmtDate(r.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(r)}
                              className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-emerald-50 hover:text-[#5B8C6D] transition-colors"
                              title="Aprobar"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(r)}
                              className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                              title="Rechazar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setReplyingTo(r)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] hover:text-[#E87B5A] transition-colors"
                          title="Responder"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-red-50 hover:text-[#C75D4A] transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {replyingTo && (
        <ReplyModal
          key={replyingTo.id}
          review={replyingTo}
          isOpen={!!replyingTo}
          onClose={() => setReplyingTo(null)}
        />
      )}
    </>
  );
}
