import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChatAssistant } from "@/components/chat/ChatAssistant";

export default function ChatPage() {
  return (
    <AppShell>
      <PageHeader
        title="Grounded Knowledge Assistant"
        subtitle="Answers grounded in your documents, with citations — and an honest “not in the knowledge base” when it’s missing."
      />
      <ChatAssistant />
    </AppShell>
  );
}
