"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import type { Review } from "@/hooks/useReviews";
import { useUpdateReview } from "@/hooks/useReviews";

const inputCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-[#D4A853] text-[#D4A853]"
              : "text-[#E8E4DE]"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReplyModal({
  review,
  isOpen,
  onClose,
}: {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
}) {
  const updateReview = useUpdateReview();
  const [reply, setReply] = useState(review.reply ?? "");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateReview.mutateAsync({
        id: review.id,
        reply: reply.trim() || null,
      });
      toast.success("Respuesta guardada");
      onClose();
    } catch {
      toast.error("Error al guardar respuesta");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            Responder Reseña
          </h2>
          <button
            onClick={onClose}
            className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pt-4">
          <div className="rounded-[10px] bg-[#FAF9F7] p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#2D2A26]">
                {review.authorName}
              </span>
              <StarRating rating={review.rating} />
            </div>
            {review.title && (
              <p className="text-sm font-medium text-[#2D2A26] mb-1">
                {review.title}
              </p>
            )}
            <p className="text-sm text-[#8A8580]">{review.body}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          <div>
            <label className="block text-sm font-medium text-[#2D2A26] mb-1">
              Tu respuesta
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className={inputCls + " min-h-[100px]"}
              placeholder="Escribe tu respuesta..."
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
            >
              Guardar Respuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
