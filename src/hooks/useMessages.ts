"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Conversation {
  peerId: string;
  peerName: string;
  peerEmail: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  tenantId: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  fromUser: { id: string; name: string | null; email: string };
  toUser: { id: string; name: string | null; email: string };
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export function useConversations() {
  return useQuery({
    queryKey: ["messages", "inbox"],
    queryFn: () =>
      fetchJSON<{ conversations: Conversation[]; totalUnread: number }>(
        "/api/messages"
      ),
    refetchInterval: 30_000,
  });
}

export function useThread(peerId: string | null) {
  return useQuery({
    queryKey: ["messages", "thread", peerId],
    queryFn: () =>
      fetchJSON<{ messages: ChatMessage[]; peerId: string }>(
        `/api/messages?with=${encodeURIComponent(peerId ?? "")}`
      ),
    enabled: !!peerId,
    refetchInterval: 15_000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { toUserId: string; body: string }) =>
      fetchJSON<{ message: ChatMessage }>("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", "inbox"] });
      qc.invalidateQueries({ queryKey: ["messages", "thread", vars.toUserId] });
    },
  });
}

export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON(`/api/messages/${id}`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON(`/api/messages/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}
