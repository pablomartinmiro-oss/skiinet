"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  GHLConversationsResponse,
  GHLMessagesResponse,
  GHLContactsResponse,
  GHLPipelinesResponse,
  GHLOpportunitiesResponse,
  GHLContact,
  GHLNotesResponse,
} from "@/lib/ghl/types";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Conversations ───────────────────────────────────────

export function useConversations(params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  return useQuery<GHLConversationsResponse & { meta: { page: number; limit: number; totalPages: number } }>({
    queryKey: ["conversations", page, limit],
    queryFn: () => fetchJSON(`/api/crm/conversations?page=${page}&limit=${limit}`),
    placeholderData: keepPreviousData,
  });
}

// ─── Inbox (nueva tabla Conversation, post-GHL) ─────────
// Lee del nuevo endpoint /api/comms/conversations (Twilio/VAPI/email/voice)
// y adapta el shape al GHLConversation que esperan los componentes UI.
// Permite que el page de /comms muestre conversaciones legacy + nuevas
// en la misma lista sin cambiar componentes.

type InboxConversation = {
  id: string;
  channel: "sms" | "whatsapp" | "email" | "voice";
  channelRef: string;
  subject: string | null;
  status: string;
  assignedTo: string | null;
  lastMessageAt: string;
  lastMessageBody: string | null;
  lastMessageDirection: string | null;
  unreadCount: number;
  lead: { id: string; name: string; email: string | null; phone: string | null } | null;
  client: { id: string; name: string; email: string | null; phone: string | null } | null;
};

export function useInboxConversations(params?: { status?: string; channel?: string; limit?: number }) {
  const status = params?.status ?? "open";
  const limit = params?.limit ?? 50;
  const channel = params?.channel;

  return useQuery({
    queryKey: ["inbox-conversations", status, channel, limit],
    queryFn: async () => {
      const sp = new URLSearchParams();
      sp.set("status", status);
      sp.set("limit", String(limit));
      if (channel) sp.set("channel", channel);
      const data = await fetchJSON<{ conversations: InboxConversation[] }>(
        `/api/comms/conversations?${sp.toString()}`,
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useInboxMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["inbox-messages", conversationId],
    queryFn: () =>
      fetchJSON<{
        conversation: InboxConversation;
        messages: Array<{
          id: string;
          direction: "inbound" | "outbound";
          channel: string;
          body: string;
          sentAt: string;
          fromAddr: string;
          toAddr: string;
          status: string | null;
        }>;
      }>(`/api/comms/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
  });
}

export function useInboxReply(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/comms/conversations/${conversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to send reply");
      }
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox-messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["inbox-conversations"] });
    },
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery<GHLMessagesResponse>({
    queryKey: ["messages", conversationId],
    queryFn: () =>
      fetchJSON(`/api/crm/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(
        `/api/crm/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }
      );
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onMutate: async (message) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversationId],
      });
      const previous =
        queryClient.getQueryData<GHLMessagesResponse>([
          "messages",
          conversationId,
        ]);
      if (previous) {
        queryClient.setQueryData<GHLMessagesResponse>(
          ["messages", conversationId],
          {
            ...previous,
            messages: [
              ...previous.messages,
              {
                id: `optimistic-${Date.now()}`,
                conversationId,
                contactId: "",
                body: message,
                direction: "outbound",
                status: "sending",
                dateAdded: new Date().toISOString(),
                messageType: "SMS",
              },
            ],
          }
        );
      }
      return { previous };
    },
    onError: (_err, _msg, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["messages", conversationId],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useAssignConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, assignedTo }: { conversationId: string; assignedTo: string | null }) => {
      const res = await fetch(`/api/crm/conversations/${conversationId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo }),
      });
      if (!res.ok) throw new Error("Failed to assign conversation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Contacts ────────────────────────────────────────────

export function useContacts(params?: { page?: number; limit?: number; query?: string }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const query = params?.query ?? "";
  const searchParam = query ? `&query=${encodeURIComponent(query)}` : "";
  return useQuery<GHLContactsResponse>({
    queryKey: ["contacts", page, limit, query],
    queryFn: () => fetchJSON(`/api/crm/contacts?page=${page}&limit=${limit}${searchParam}`),
    placeholderData: keepPreviousData,
  });
}

export function useContact(contactId: string | null) {
  return useQuery<{ contact: GHLContact }>({
    queryKey: ["contact", contactId],
    queryFn: () => fetchJSON(`/api/crm/contacts/${contactId}`),
    enabled: !!contactId,
  });
}

export function useContactNotes(contactId: string | null) {
  return useQuery<GHLNotesResponse>({
    queryKey: ["contact-notes", contactId],
    queryFn: () => fetchJSON(`/api/crm/contacts/${contactId}/notes`),
    enabled: !!contactId,
  });
}

export function useAddNote(contactId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/crm/contacts/${contactId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({
        queryKey: ["contact-notes", contactId],
      });
      const previous = queryClient.getQueryData<GHLNotesResponse>([
        "contact-notes",
        contactId,
      ]);
      if (previous) {
        queryClient.setQueryData<GHLNotesResponse>(
          ["contact-notes", contactId],
          {
            notes: [
              {
                id: `optimistic-${Date.now()}`,
                contactId,
                body,
                userId: "",
                dateAdded: new Date().toISOString(),
              },
              ...previous.notes,
            ],
          }
        );
      }
      return { previous };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["contact-notes", contactId],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["contact-notes", contactId],
      });
    },
  });
}

export function useUpdateContact(contactId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/crm/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update contact");
      return res.json() as Promise<{ contact: GHLContact }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContact(contactId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete contact");
      return res.json() as Promise<{ success: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// ─── Pipelines ───────────────────────────────────────────

export function usePipelines() {
  return useQuery<GHLPipelinesResponse>({
    queryKey: ["pipelines"],
    queryFn: () => fetchJSON("/api/crm/pipelines"),
  });
}

export function useOpportunities(pipelineId: string | null) {
  return useQuery<GHLOpportunitiesResponse>({
    queryKey: ["opportunities", pipelineId],
    queryFn: () =>
      fetchJSON(`/api/crm/opportunities?pipelineId=${pipelineId}&limit=2500`),
    enabled: !!pipelineId,
  });
}

export function useMoveOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stageId }: { id: string; stageId: string }) => {
      const res = await fetch(`/api/crm/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });
      if (!res.ok) throw new Error("Failed to move opportunity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}
