"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useThread,
  useSendMessage,
  useMarkMessageRead,
  type ChatMessage,
} from "@/hooks/useMessages";

function MensajesContent() {
  const params = useSearchParams();
  const initialPeer = params.get("to");
  const { data: session } = useSession();
  const myUserId = session?.user?.id;

  const [activePeerId, setActivePeerId] = useState<string | null>(initialPeer);
  const [draft, setDraft] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  const { data: inbox } = useConversations();
  const conversations = useMemo(() => inbox?.conversations ?? [], [inbox]);
  const { data: threadData } = useThread(activePeerId);
  const messages = useMemo(() => threadData?.messages ?? [], [threadData]);

  const sendMutation = useSendMessage();
  const markReadMutation = useMarkMessageRead();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark unread messages from peer as read
  useEffect(() => {
    if (!activePeerId || !myUserId) return;
    for (const m of messages) {
      if (m.toUserId === myUserId && !m.isRead) {
        markReadMutation.mutate(m.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePeerId, messages.length]);

  // If no convo is active and inbox arrives, pick first
  useEffect(() => {
    if (!activePeerId && conversations.length > 0) {
      setActivePeerId(conversations[0].peerId);
    }
  }, [activePeerId, conversations]);

  // Determine peer label for the header
  const peerLabel = useMemo(() => {
    if (!activePeerId) return "";
    const conv = conversations.find((c) => c.peerId === activePeerId);
    if (conv) return conv.peerName;
    // Fallback when started fresh from ?to=<id>
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return "";
    const peer = lastMsg.fromUserId === activePeerId ? lastMsg.fromUser : lastMsg.toUser;
    return peer.name ?? peer.email;
  }, [activePeerId, conversations, messages]);

  const handleSend = async () => {
    if (!activePeerId || !draft.trim() || sendMutation.isPending) return;
    try {
      await sendMutation.mutateAsync({ toUserId: activePeerId, body: draft.trim() });
      setDraft("");
    } catch {
      /* toast handled elsewhere */
    }
  };

  return (
    <div className="-m-4 flex h-[calc(100dvh-7.5rem)] overflow-hidden md:-m-7 md:h-[calc(100vh-3.5rem)]">
      {/* Conversation list — desktop always; mobile only when no peer active */}
      <aside
        className={cn(
          "w-full flex-col border-r border-[#E8E4DE] bg-white md:flex md:w-[320px]",
          activePeerId ? "hidden md:flex" : "flex"
        )}
      >
        <div className="border-b border-[#E8E4DE] px-4 py-4">
          <h1 className="text-lg font-bold text-[#2D2A26]">Mensajes</h1>
          <p className="text-xs text-[#8A8580] mt-0.5">
            {conversations.length} conversación{conversations.length !== 1 ? "es" : ""}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <MessageSquare className="h-12 w-12 text-[#E8E4DE]" />
              <p className="text-sm text-[#8A8580]">Sin conversaciones aún</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activePeerId === c.peerId;
              return (
                <button
                  key={c.peerId}
                  onClick={() => setActivePeerId(c.peerId)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-[#E8E4DE] px-4 py-3 text-left transition-colors min-h-[64px]",
                    isActive ? "bg-[#E87B5A]/5" : "hover:bg-[#FAF9F7]"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E87B5A]/10 text-sm font-bold text-[#E87B5A]">
                    {(c.peerName || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[#2D2A26]">{c.peerName}</p>
                      <span className="shrink-0 text-[10px] text-[#8A8580]">
                        {new Date(c.lastAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#8A8580]">{c.lastMessage}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="ml-1 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#E87B5A] px-1.5 text-[10px] font-bold leading-none text-white">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Thread — desktop always; mobile only when peer active */}
      <section
        className={cn(
          "flex-1 flex-col bg-[#FAF9F7]",
          activePeerId ? "flex" : "hidden md:flex"
        )}
      >
        {!activePeerId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <MessageSquare className="h-14 w-14 text-[#E8E4DE]" />
            <p className="text-sm text-[#8A8580]">Selecciona una conversación</p>
          </div>
        ) : (
          <>
            <header className="flex min-h-[56px] items-center gap-3 border-b border-[#E8E4DE] bg-white px-4 py-2">
              <button
                onClick={() => setActivePeerId(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#8A8580] hover:bg-[#FAF9F7] md:hidden"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E87B5A]/10 text-sm font-bold text-[#E87B5A]">
                {(peerLabel || "?")[0].toUpperCase()}
              </div>
              <p className="font-semibold text-[#2D2A26]">{peerLabel || "Conversación"}</p>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 ? (
                <p className="mt-8 text-center text-sm text-[#8A8580]">
                  Sin mensajes. Escribe el primero.
                </p>
              ) : (
                messages.map((m) => <Bubble key={m.id} message={m} myUserId={myUserId} />)
              )}
              <div ref={threadEndRef} />
            </div>

            <footer className="border-t border-[#E8E4DE] bg-white p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-[#E8E4DE] bg-white px-3 py-2.5 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A] min-h-[44px] max-h-[120px]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sendMutation.isPending}
                  aria-label="Enviar"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E87B5A] text-white hover:bg-[#D56E4F] disabled:opacity-40 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

function Bubble({ message, myUserId }: { message: ChatMessage; myUserId: string | undefined }) {
  const isMine = message.fromUserId === myUserId;
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-sm",
          isMine
            ? "bg-[#E87B5A] text-white rounded-br-md"
            : "bg-white text-[#2D2A26] rounded-bl-md border border-[#E8E4DE]"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p className={cn("mt-1 text-[10px]", isMine ? "text-white/70" : "text-[#8A8580]")}>
          {new Date(message.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function MensajesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#8A8580]">Cargando...</div>}>
      <MensajesContent />
    </Suspense>
  );
}
