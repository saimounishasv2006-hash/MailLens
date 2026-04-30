import nlp from "compromise";
import compromiseDates from "compromise-dates";
import compromiseNumbers from "compromise-numbers";
import { Highlight, HighlightType, ParsedEmail } from "@/types";

// Register plugins
nlp.plugin(compromiseDates);
nlp.plugin(compromiseNumbers);

const HIGHLIGHT_COLORS: Record<HighlightType, string> = {
  action_item: "rgba(99, 102, 241, 0.25)",
  deadline: "rgba(239, 68, 68, 0.25)",
  person: "rgba(16, 185, 129, 0.25)",
  amount: "rgba(245, 158, 11, 0.25)",
  link: "rgba(59, 130, 246, 0.25)",
  phone: "rgba(139, 92, 246, 0.25)",
  question: "rgba(236, 72, 153, 0.25)",
  urgent: "rgba(239, 68, 68, 0.4)",
};

const URGENT_KEYWORDS = [
  "urgent",
  "asap",
  "immediately",
  "critical",
  "deadline",
  "overdue",
  "action required",
  "important",
  "time-sensitive",
  "priority",
  "by end of day",
  "eod",
  "eow",
];

const ACTION_PATTERNS = [
  /please\s+\w+/gi,
  /could you\s+\w+/gi,
  /can you\s+\w+/gi,
  /need you to\s+\w+/gi,
  /make sure\s+\w+/gi,
  /don't forget\s+\w+/gi,
  /remember to\s+\w+/gi,
  /follow up\s*/gi,
];

function findMatches(
  text: string,
  pattern: RegExp,
  type: HighlightType,
  emailId: string,
): Highlight[] {
  const results: Highlight[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g",
  );
  while ((match = re.exec(text)) !== null) {
    if (match[0].trim().length < 2) continue;
    results.push({
      id: `${emailId}-${type}-${match.index}`,
      emailId,
      type,
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      color: HIGHLIGHT_COLORS[type],
    });
  }
  return results;
}

export function extractHighlights(email: ParsedEmail): Highlight[] {
  const { body, id } = email;
  const doc = nlp(body) as any;
  const allHighlights: Highlight[] = [];

  // 👤 People
  try {
    doc.people().forEach((person: any) => {
      const text = person.text();
      const idx = body.indexOf(text);
      if (idx !== -1 && text.length > 2) {
        allHighlights.push({
          id: `${id}-person-${idx}`,
          emailId: id,
          type: "person",
          text,
          startIndex: idx,
          endIndex: idx + text.length,
          color: HIGHLIGHT_COLORS.person,
          tooltip: "Person mentioned",
        });
      }
    });
  } catch (_) {}

  // 📅 Dates — using plugin
  try {
    doc.dates().forEach((date: any) => {
      const text = date.text();
      const idx = body.indexOf(text);
      if (idx !== -1 && text.length > 1) {
        allHighlights.push({
          id: `${id}-deadline-${idx}`,
          emailId: id,
          type: "deadline",
          text,
          startIndex: idx,
          endIndex: idx + text.length,
          color: HIGHLIGHT_COLORS.deadline,
          tooltip: "Date / Deadline",
        });
      }
    });
  } catch (_) {}

  // 💰 Money — using plugin
  try {
    doc.money().forEach((m: any) => {
      const text = m.text();
      const idx = body.indexOf(text);
      if (idx !== -1) {
        allHighlights.push({
          id: `${id}-amount-${idx}`,
          emailId: id,
          type: "amount",
          text,
          startIndex: idx,
          endIndex: idx + text.length,
          color: HIGHLIGHT_COLORS.amount,
          tooltip: "Amount / Money",
        });
      }
    });
  } catch (_) {}

  // 💰 Fallback regex for money (catches $100, ₹500, €200 etc.)
  allHighlights.push(
    ...findMatches(body, /[$₹€£¥]\s?\d[\d,.]*/g, "amount", id),
  );

  // ❓ Questions
  try {
    doc
      .sentences()
      .filter((s: any) => s.has("?"))
      .forEach((s: any) => {
        const text = s.text().trim();
        const idx = body.indexOf(text);
        if (idx !== -1 && text.length > 5) {
          allHighlights.push({
            id: `${id}-question-${idx}`,
            emailId: id,
            type: "question",
            text,
            startIndex: idx,
            endIndex: idx + text.length,
            color: HIGHLIGHT_COLORS.question,
            tooltip: "Question",
          });
        }
      });
  } catch (_) {}

  // 🔴 Urgent keywords
  URGENT_KEYWORDS.forEach((kw) => {
    const re = new RegExp(`\\b${kw}\\b`, "gi");
    allHighlights.push(...findMatches(body, re, "urgent", id));
  });

  // ✅ Action items
  ACTION_PATTERNS.forEach((pattern) => {
    allHighlights.push(...findMatches(body, pattern, "action_item", id));
  });

  // 📞 Phone numbers
  allHighlights.push(
    ...findMatches(body, /(\+?\d[\d\s\-().]{7,}\d)/g, "phone", id),
  );

  // Sort and deduplicate
  return deduplicateHighlights(
    allHighlights.sort((a, b) => a.startIndex - b.startIndex),
  );
}

function deduplicateHighlights(highlights: Highlight[]): Highlight[] {
  const result: Highlight[] = [];
  let lastEnd = -1;
  for (const h of highlights) {
    if (h.startIndex >= lastEnd) {
      result.push(h);
      lastEnd = h.endIndex;
    }
  }
  return result;
}

export function extractActionItems(body: string): string[] {
  const items: string[] = [];
  ACTION_PATTERNS.forEach((pattern) => {
    const matches = body.match(new RegExp(pattern.source, "gi")) || [];
    items.push(...matches.map((m) => m.trim()));
  });
  return [...new Set(items)].slice(0, 10);
}
