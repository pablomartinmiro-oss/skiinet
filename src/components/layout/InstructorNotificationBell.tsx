"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function InstructorNotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useNotifications();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const items = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#2D2A26] hover:bg-[#FAF9F7] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E87B5A] px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[320px] max-w-[90vw] rounded-2xl border border-[#E8E4DE] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E8E4DE] px-4 py-3">
            <p className="text-sm font-semibold text-[#2D2A26]">Notificaciones</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="text-xs font-medium text-[#E87B5A] hover:underline"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-[#8A8580]">
                Sin notificaciones
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group relative border-b border-[#E8E4DE] px-4 py-3 last:border-0 transition-colors",
                    !n.isRead ? "bg-[#E87B5A]/5" : "bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm leading-snug", !n.isRead ? "font-semibold text-[#2D2A26]" : "text-[#2D2A26]")}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-[#8A8580] leading-relaxed line-clamp-3">{n.body}</p>
                      )}
                      <p className="mt-1 text-[10px] text-[#8A8580]">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!n.isRead && (
                        <button
                          type="button"
                          aria-label="Marcar como leída"
                          onClick={() => markOne.mutate(n.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5B8C6D] hover:bg-[#5B8C6D]/10"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => remove.mutate(n.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#C75D4A] hover:bg-[#C75D4A]/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
