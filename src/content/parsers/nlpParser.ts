import nlp from "compromise";
import { Highlight, HighlightType, ParsedEmail } from "@/types";

const HIGHLIGHT_COLORS: Record<HighlightType, string> = {
  action_item: "rgba(99, 102, 241, 0.25)", // indigo
  deadline: "rgba(239, 68, 68, 0.25)", // red
  person: "rgba(16, 185, 129, 0.25)", // green
  amount: "rgba(245, 158, 11, 0.25)", // amber
  link: "rgba(59, 130, 246, 0.25)", // blue
  phone: "rgba(139, 92, 246, 0.25)", // purple
  question: "rgba(236, 72, 153, 0.25)", // pink
  urgent: "rgba(239, 68, 68, 0.4)", // red (stronger)
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
  const doc = nlp(body);
  const allHighlights: Highlight[] = [];

  // 👤 People
  doc.people().forEach((person) => {
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

  // 📅 Dates / Deadlines
  doc.dates().forEach((date) => {
    const text = date.text();
    const idx = body.indexOf(text);
    if (idx !== -1) {
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

  // 💰 Money amounts
  doc.money().forEach((m) => {
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

  // ❓ Questions
  doc
    .sentences()
    .filter((s) => s.has("?"))
    .forEach((s) => {
      const text = s.text();
      const idx = body.indexOf(text);
      if (idx !== -1) {
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

  // Sort by position, remove overlaps
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
  const doc = nlp(body);
  const items: string[] = [];

  ACTION_PATTERNS.forEach((pattern) => {
    const matches = body.match(new RegExp(pattern.source, "gi")) || [];
    items.push(...matches.map((m) => m.trim()));
  });

  // Also grab imperative sentences
  doc.sentences().forEach((s) => {
    const text = s.text().trim();
    if (text.match(/^(please|could|can|need|make sure|don't|remember)/i)) {
      if (!items.includes(text)) items.push(text);
    }
  });

  return [...new Set(items)].slice(0, 10);
}
