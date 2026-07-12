"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, Info, Send, Check, CheckCheck } from "lucide-react";
import type { ChatThread, ChatMessage } from "@/types/modules";
import { api } from "@/mock/api";
import { Avatar } from "@/components/ui/misc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/ui/async-state";
import { ListRowSkeleton } from "@/components/ui/skeletons";
import { cn, formatTime } from "@/lib/utils";
import { NOW } from "@/constants";

/** Réponses automatiques simulées (déterministes, en français). */
const AUTO_REPLIES = [
  "Bien reçu 👍 Je m'en occupe tout de suite.",
  "Merci pour votre message ! Un instant s'il vous plaît…",
  "C'est noté, je reviens vers vous très vite.",
  "Parfait, je transmets l'information à l'équipe.",
  "Pas de souci, je vérifie cela pour vous 🙏",
];

/** Horodatage déterministe basé sur NOW (jamais Date.now). */
function nowIso(offsetMs = 0) {
  return new Date(NOW + offsetMs).toISOString();
}

export function Conversation({ thread, onBack }: { thread: ChatThread; onBack: () => void }) {
  const msgQuery = useQuery({
    queryKey: ["chatMessages", thread.id],
    queryFn: () => api.chatMessages(thread.id),
  });

  const [local, setLocal] = React.useState<ChatMessage[]>([]);
  const [typing, setTyping] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const counter = React.useRef(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const base = msgQuery.data ?? [];
  const messages = React.useMemo(() => [...base, ...local], [base, local]);

  // Auto-scroll en bas à chaque nouveau message / indicateur de saisie.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  // Nettoie les timers en attente au démontage.
  React.useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const n = counter.current++;
    const mine: ChatMessage = {
      id: `local-me-${thread.id}-${n}`,
      threadId: thread.id,
      from: "me",
      text,
      at: nowIso(n * 4000),
      status: "read",
    };
    setLocal((l) => [...l, mine]);
    setDraft("");
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      const reply: ChatMessage = {
        id: `local-them-${thread.id}-${n}`,
        threadId: thread.id,
        from: "them",
        text: AUTO_REPLIES[n % AUTO_REPLIES.length],
        at: nowIso(n * 4000 + 1200),
      };
      setLocal((l) => [...l, reply]);
    }, 1200);
    timers.current.push(t);
  }

  return (
    <div className="flex h-full flex-col bg-shell/40">
      {/* En-tête conversation */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-3 py-2.5 md:px-4">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-shell md:hidden"
          aria-label="Retour à la liste"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative shrink-0">
          <Avatar src={thread.avatar} alt={thread.name} size={42} />
          {thread.online && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-success" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-semibold text-ink">{thread.name}</p>
          <p className={cn("text-[12px]", thread.online ? "text-success" : "text-muted")}>
            {thread.online ? "En ligne" : "Hors ligne"}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Appeler">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Informations">
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Fil de messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5">
        <QueryState
          query={msgQuery}
          skeleton={
            <div className="space-y-2">
              <ListRowSkeleton />
              <ListRowSkeleton />
              <ListRowSkeleton />
            </div>
          }
        >
          {() => (
            <div className="space-y-2.5">
              {messages.map((m) => (
                <Bubble key={m.id} message={m} />
              ))}
              <AnimatePresence>{typing && <TypingIndicator />}</AnimatePresence>
            </div>
          )}
        </QueryState>
      </div>

      {/* Champ de saisie */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex shrink-0 items-center gap-2 border-t border-line bg-surface px-3 py-2.5 md:px-4"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écrivez un message…"
          className="flex-1"
          aria-label="Message"
        />
        <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Envoyer">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.from === "me";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn("flex", mine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-card",
          mine
            ? "rounded-br-md brand-gradient text-white"
            : "rounded-bl-md border border-line bg-surface text-ink",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            mine ? "text-white/70" : "text-muted",
          )}
        >
          <span>{formatTime(message.at)}</span>
          {mine &&
            (message.status === "read" ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            ))}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex justify-start"
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-3 shadow-card">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
