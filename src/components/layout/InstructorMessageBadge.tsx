"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useConversations } from "@/hooks/useMessages";

export function InstructorMessageBadge() {
  const { data } = useConversations();
  const unread = data?.totalUnread ?? 0;

  return (
    <Link
      href="/profesores/mensajes"
      aria-label={`Mensajes${unread ? ` (${unread} sin leer)` : ""}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#2D2A26] hover:bg-[#FAF9F7] transition-colors"
    >
      <MessageSquare className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E87B5A] px-1 text-[10px] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
