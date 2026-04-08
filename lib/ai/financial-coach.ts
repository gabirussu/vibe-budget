/**
 * LIB: AI Financial Coach
 *
 * Construiește prompt-ul pentru Claude și apelează SDK-ul Anthropic.
 * Primește date agregate (NU tranzacții individuale) și returnează analiză structurată.
 */

import Anthropic from "@anthropic-ai/sdk";

// ─── Tipuri input ─────────────────────────────────────────────────────────────

export interface CategorySummary {
  name: string;
  icon: string;
  totalSpent: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  cheltuieli: number;
  venituri: number;
}

export interface FinancialData {
  period: string;
  summary: {
    totalCheltuieli: number;
    totalVenituri: number;
    sold: number;
  };
  topCategories: CategorySummary[];
  monthlyTrends: MonthlyTrend[];
  currency: string;
}

// ─── Tipuri output ────────────────────────────────────────────────────────────

export interface FinancialTip {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface FinancialAnalysis {
  healthScore: number;
  healthLabel: string;
  healthExplanation: string;
  tips: FinancialTip[];
  positiveObservation: string;
}

// ─── Prompt-uri ───────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Ești un coach financiar personal pentru utilizatori din România.
Analizezi date financiare agregate și oferi sfaturi personalizate, practice și prietenoase.

REGULI STRICTE:
1. Răspunzi EXCLUSIV în format JSON valid, fără text suplimentar înainte sau după.
2. Nu inventa date care nu există în input.
3. Sfaturile trebuie să fie specifice valorilor primite, nu generice.
4. Tonul este prietenos, constructiv, niciodată critic sau moralizator.
5. Toate sumele sunt în RON (lei românești).

FORMAT RĂSPUNS (respectă exact această structură):
{
  "healthScore": <număr întreg 0-100>,
  "healthLabel": "<Excelent|Bun|Acceptabil|Necesită atenție|Critic>",
  "healthExplanation": "<1-2 propoziții care explică scorul>",
  "tips": [
    {
      "title": "<titlu scurt max 8 cuvinte>",
      "description": "<explicație practică 1-2 propoziții>",
      "priority": "<high|medium|low>"
    }
  ],
  "positiveObservation": "<1 lucru pozitiv specific din datele primite>"
}

CRITERII HEALTH SCORE:
- 80-100 (Excelent): sold pozitiv > 30% din venituri, cheltuieli echilibrate pe categorii
- 60-79 (Bun): sold pozitiv, fără categorie dominantă peste 50% din cheltuieli
- 40-59 (Acceptabil): sold mic pozitiv sau zero, pattern cheltuieli acceptabil
- 20-39 (Necesită atenție): sold negativ sau o categorie depășește 60% din cheltuieli
- 0-19 (Critic): cheltuieli depășesc semnificativ veniturile`;
}

function buildUserPrompt(data: FinancialData): string {
  const periodLabel: Record<string, string> = {
    luna_curenta: "luna curentă",
    "3_luni": "ultimele 3 luni",
    "6_luni": "ultimele 6 luni",
    tot: "toată perioada disponibilă",
  };

  const fmt = (n: number) =>
    n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const savingsRate =
    data.summary.totalVenituri > 0
      ? ((data.summary.sold / data.summary.totalVenituri) * 100).toFixed(1)
      : "N/A";

  const categoriesText =
    data.topCategories.length > 0
      ? data.topCategories
          .map(
            (c, i) =>
              `  ${i + 1}. ${c.icon} ${c.name}: ${fmt(c.totalSpent)} ${data.currency} (${c.percentage}%)`
          )
          .join("\n")
      : "  Nicio categorie disponibilă";

  const trendsText =
    data.monthlyTrends.length > 0
      ? data.monthlyTrends
          .map(
            (m) =>
              `  ${m.month}: Cheltuieli ${fmt(m.cheltuieli)} ${data.currency}, Venituri ${fmt(m.venituri)} ${data.currency}`
          )
          .join("\n")
      : "  Nicio dată lunară disponibilă";

  return `Analizează situația financiară pentru ${periodLabel[data.period] ?? data.period}:

REZUMAT FINANCIAR:
- Total cheltuieli: ${fmt(data.summary.totalCheltuieli)} ${data.currency}
- Total venituri: ${fmt(data.summary.totalVenituri)} ${data.currency}
- Sold net: ${fmt(data.summary.sold)} ${data.currency} (${data.summary.sold >= 0 ? "pozitiv" : "NEGATIV"})
- Rata de economisire: ${savingsRate}%

CHELTUIELI PE CATEGORII (descrescător):
${categoriesText}

EVOLUȚIE LUNARĂ:
${trendsText}

Oferă 3-5 sfaturi personalizate bazate pe aceste date concrete. Răspunde DOAR cu JSON valid.`;
}

// ─── Parser răspuns Claude ────────────────────────────────────────────────────

function parseClaudeResponse(text: string): FinancialAnalysis {
  // Claude poate returna uneori JSON înconjurat de markdown code fences
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as unknown;

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("healthScore" in parsed) ||
    !("tips" in parsed)
  ) {
    throw new Error("Structura răspunsului AI este invalidă");
  }

  return parsed as FinancialAnalysis;
}

// ─── Funcție publică ──────────────────────────────────────────────────────────

export async function analyzeFinances(data: FinancialData): Promise<FinancialAnalysis> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(data) }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Răspuns invalid de la Claude");
  }

  return parseClaudeResponse(content.text);
}
