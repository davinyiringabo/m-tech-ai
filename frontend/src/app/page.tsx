import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TriageDashboard } from "@/components/triage/TriageDashboard";

export default function Home() {
  return (
    <AppShell>
      <PageHeader
        title="Smart Intake Triage"
        subtitle="Classify, extract, and draft replies — validated structured output from a self-hosted LLM."
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          <TriageDashboard />
        </div>
      </div>
    </AppShell>
  );
}
