import { pool } from "../db/index.js";
import { triageText } from "../triage/service.js";

// Sample inbound messages spanning categories/priorities for the dashboard demo.
const SAMPLES = [
  "URGENT: Our entire team has been locked out of the dashboard for 2 hours. Production is down. This is costing us money! - Sarah from Acme Corp",
  "Hi, I was double charged $49 on invoice #INV-2025-0042 this month. Could you please refund the extra charge? Thanks, Mike",
  "Love the new analytics view! Any chance you could add CSV export for the reports? Would save me a ton of time.",
  "I can't reset my password. The reset email never arrives. I've checked spam. My account is john.doe@example.com.",
  "Your product is okay but the mobile app keeps crashing when I open the settings page on my iPhone. Order ID: ORD-99812.",
  "Just wanted to say the support team was incredibly helpful yesterday. Great experience overall!",
];

async function seed() {
  console.log(
    `Seeding ${SAMPLES.length} sample tickets (this calls the LLM, please wait)...`,
  );
  for (const [i, text] of SAMPLES.entries()) {
    const record = await triageText(text);
    console.log(
      `  [${i + 1}/${SAMPLES.length}] ${record.category}/${record.priority} (${record.status}) - ${record.summary}`,
    );
  }
  console.log("Seeding complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
