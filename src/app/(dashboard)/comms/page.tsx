"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, ArrowLeft } from "lucide-react";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useAssignConversation,
  useContact,
  useInboxConversations,
  useInboxMessages,
  useInboxReply,
} from "@/hooks/useGHL";
import { usePermissions } from "@/hooks/usePermissions";
import { EmptyState } from "@/components/shared/EmptyState";
import { GHLEmptyState } from "@/components/shared/GHLEmptyState";
import { ConversationList } from "./_components/ConversationList";
import { MessageThread } from "./_components/MessageThread";
import { MessageInput } from "./_components/MessageInput";
import { ContactSidebar } from "./_components/ContactSidebar";
import { AssignDropdown } from "./_components/AssignDropdown";
import { ChannelBadge } from "./_components/ChannelBadge";
import type { GHLConversation, GHLMessage } from "@/lib/ghl/types";
import { toast } from "sonner";

const INBOX_PREFIX = "inbox:"; // distinguishes new Conversation IDs from legacy GHL IDs

export default function CommsPage() {
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [convoPage, setConvoPage] = useState(1);
  // Legacy GHL conversations (CachedConversation table)
  const { data: convoData, isLoading: convosLoading } = useConversations({ limit: 50, page: convoPage });
  // New Conversation table (Twilio/VAPI/Email/Voice — post-GHL)
  const { data: inboxData, isLoading: inboxLoading } = useInboxConversations({ limit: 50 });

  const isInboxId = selectedId?.startsWith(INBOX_PREFIX) ?? false;
  const rawSelectedId = isInboxId ? selectedId!.slice(INBOX_PREFIX.length) : selectedId;

  const { data: msgData, isLoading: msgsLoading } = useMessages(isInboxId ? null : rawSelectedId);
  const { data: inboxMsgData, isLoading: inboxMsgsLoading } = useInboxMessages(isInboxId ? rawSelectedId : null);

  const sendMessage = useSendMessage(!isInboxId && rawSelectedId ? rawSelectedId : "");
  const inboxReply = useInboxReply(isInboxId && rawSelectedId ? rawSelectedId : "");
  const assignConversation = useAssignConversation();

  // Merge both sources into a single GHLConversation[] list.
  // New Conversation rows are adapted to GHLConversation shape (with INBOX_PREFIX
  // on the id) so the existing ConversationList component works unchanged.
  const conversations = useMemo<GHLConversation[]>(() => {
    const legacy = convoData?.conversations ?? [];
    const inboxRows = inboxData?.conversations ?? [];
    const channelToType: Record<string, string> = {
      sms: "TYPE_SMS",
      whatsapp: "TYPE_WHATSAPP",
      email: "TYPE_EMAIL",
      voice: "TYPE_CALL",
    };
    const adapted: GHLConversation[] = inboxRows.map((c) => {
      const contactName = c.lead?.name ?? c.client?.name ?? c.channelRef;
      const contactEmail = c.lead?.email ?? c.client?.email ?? null;
      const contactPhone = c.lead?.phone ?? c.client?.phone ?? null;
      return {
        id: `${INBOX_PREFIX}${c.id}`,
        contactId: c.lead?.id ?? c.client?.id ?? "",
        contactName,
        contactEmail: contactEmail ?? undefined,
        contactPhone: contactPhone ?? undefined,
        lastMessageBody: c.lastMessageBody ?? "",
        lastMessageDate: c.lastMessageAt,
        lastMessageType: channelToType[c.channel] ?? "TYPE_SMS",
        unreadCount: c.unreadCount,
        assignedTo: c.assignedTo ?? null,
        type: channelToType[c.channel] ?? "TYPE_SMS",
      } as unknown as GHLConversation;
    });
    return [...adapted, ...legacy];
  }, [convoData, inboxData]);

  // Adapt InboxMessage to GHLMessage shape for MessageThread
  const messages: GHLMessage[] = useMemo(() => {
    if (isInboxId && inboxMsgData) {
      return inboxMsgData.messages.map(
        (m) =>
          ({
            id: m.id,
            conversationId: rawSelectedId ?? "",
            contactId: "",
            body: m.body,
            direction: m.direction,
            status: m.status ?? "delivered",
            dateAdded: m.sentAt,
            messageType: m.channel === "whatsapp" ? "TYPE_WHATSAPP" : m.channel === "voice" ? "TYPE_CALL" : "TYPE_SMS",
          }) as unknown as GHLMessage,
      );
    }
    return msgData?.messages ?? [];
  }, [isInboxId, inboxMsgData, msgData, rawSelectedId]);

  const selectedConvo = useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId]
  );

  // Fetch full contact data for sidebar — only for legacy GHL conversations.
  // Inbox rows already have lead/client embedded.
  const contactId = !isInboxId ? selectedConvo?.contactId ?? null : null;
  const { data: contactData, isLoading: contactLoading } = useContact(contactId);
  const sidebarContact = contactData?.contact ?? null;

  function handleSend(message: string) {
    if (isInboxId) {
      inboxReply.mutate(message, {
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Error al enviar la respuesta");
        },
      });
      return;
    }
    sendMessage.mutate(message, {
      onError: () => {
        toast.error("Error al enviar el mensaje. Inténtalo de nuevo.");
      },
    });
  }

  function handleAssign(userId: string | null) {
    if (!selectedId) return;
    assignConversation.mutate(
      { conversationId: selectedId, assignedTo: userId },
      {
        onSuccess: () => toast.success("Asignación actualizada"),
        onError: () => toast.error("Error al asignar la conversación"),
      }
    );
  }

  // GHLEmptyState only shows the "connect GHL" prompt when BOTH sources are
  // empty. If we have inbox conversations from Twilio/VAPI, the inbox is alive
  // even without GHL connected.
  const hasAnyData = (convoData?.conversations?.length ?? 0) > 0 || (inboxData?.conversations?.length ?? 0) > 0;

  const wrapper = hasAnyData ? (
    <></>
  ) : null;
  void wrapper;

  return (
    <GHLEmptyState message="No hay conversaciones. Conecta GoHighLevel o Twilio/VAPI para gestionar tus comunicaciones." disabled={hasAnyData}>
    <div className="-m-4 md:-m-6 flex h-[calc(100vh-3.5rem)]">
      {/* Left panel: Conversation list */}
      <div className={`w-full md:w-80 md:shrink-0 flex flex-col ${selectedId ? "hidden md:flex" : "flex"}`}>
        <ConversationList
          conversations={conversations}
          loading={convosLoading || inboxLoading}
          selectedId={selectedId}
          currentUserId={session?.user?.id ?? ""}
          onSelect={setSelectedId}
        />
        {/* Pagination */}
        {convoData && convoData.meta && convoData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-white px-3 py-2 text-xs text-slate-500">
            <button
              disabled={convoPage <= 1}
              onClick={() => setConvoPage(p => Math.max(1, p - 1))}
              className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span>{convoPage} / {convoData.meta.totalPages}</span>
            <button
              disabled={convoPage >= convoData.meta.totalPages}
              onClick={() => setConvoPage(p => p + 1)}
              className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Center panel: Message thread */}
      {selectedId ? (
        <div className={`flex flex-1 flex-col ${selectedId ? "block" : "hidden md:block"}`}>
          {/* Thread header */}
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1 rounded-lg p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors md:hidden min-h-[44px] min-w-[44px] justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-semibold text-slate-900">
                {selectedConvo?.contactName ?? "Conversación"}
              </h2>
              {selectedConvo && (
                <ChannelBadge type={selectedConvo.type} size="md" />
              )}
            </div>
            {can("comms:assign") && (
              <AssignDropdown
                currentAssignee={selectedConvo?.assignedTo ?? null}
                onAssign={handleAssign}
                disabled={assignConversation.isPending}
              />
            )}
          </div>

          <MessageThread messages={messages} loading={isInboxId ? inboxMsgsLoading : msgsLoading} />

          <MessageInput
            onSend={handleSend}
            disabled={!can("comms:send")}
            sending={isInboxId ? inboxReply.isPending : sendMessage.isPending}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-surface">
          <EmptyState
            icon={MessageSquare}
            title="Selecciona una conversación"
            description="Elige una conversación de la lista para ver los mensajes"
          />
        </div>
      )}

      {/* Right panel: Contact sidebar */}
      {selectedId && (
        <div className="hidden lg:block">
          <ContactSidebar
            contact={sidebarContact}
            loading={contactLoading || msgsLoading}
          />
        </div>
      )}
    </div>
    </GHLEmptyState>
  );
}
