import type { Metadata } from "next";
import { ChatView } from "@/features/chat/chat-view";

export const metadata: Metadata = {
  title: "Messages · NOVIGO",
  description: "Discutez en temps réel avec le support, vos livreurs et les commerçants.",
};

export default function ChatPage() {
  return <ChatView />;
}
