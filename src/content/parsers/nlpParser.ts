import nlp from "compromise";
import compromiseDates from "compromise-dates";
import compromiseNumbers from "compromise-numbers";
import { Highlight, HighlightType, ParsedEmail } from "@/types";

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
];

const ACTION_PATTERNS = [
  /please\s+\w+/gi,
  /could you\s+\w+/gi,
  /can you\s+\w+/gi,
  /need you to\s+\w+/gi,
  /make sure\s+\w+/gi,
  /don't forget\s+\w+/gi,
  /remember to\s+\w+/gi,
  /follow up/gi,
];

function findWholeWordMatches(
  text: string,
  term: string,
  type: HighlightType,
  emailId: string,
): Highlight[] {
  const results: Highlight[] = [];
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    results.push({
      id: `${emailId}-${type}-${match.index}`,
      emailId,
      type,
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      color: HIGHLIGHT_COLORS[type],
      tooltip: getTooltipLabel(type),
    });
  }
  return results;
}

function findPatternMatches(
  text: string,
  pattern: RegExp,
  type: HighlightType,
  emailId: string,
): Highlight[] {
  const results: Highlight[] = [];
  const re = new RegExp(pattern.source, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const matched = match[0].trim();
    if (matched.length < 3) continue;
    if (match.index > 0 && /\w/.test(text[match.index - 1])) continue;
    results.push({
      id: `${emailId}-${type}-${match.index}`,
      emailId,
      type,
      text: matched,
      startIndex: match.index,
      endIndex: match.index + matched.length,
      color: HIGHLIGHT_COLORS[type],
      tooltip: getTooltipLabel(type),
    });
  }
  return results;
}

function getTooltipLabel(type: HighlightType): string {
  const map: Record<HighlightType, string> = {
    action_item: "Action Item",
    deadline: "Date / Deadline",
    person: "Person Mentioned",
    amount: "Amount / Money",
    link: "Link",
    phone: "Phone Number",
    question: "Question",
    urgent: "Urgent",
  };
  return map[type];
}

export function extractHighlights(email: ParsedEmail): Highlight[] {
  const { body, id } = email;
  const doc = nlp(body) as any;
  const allHighlights: Highlight[] = [];

  try {
    doc.people().forEach((person: any) => {
      const text = person.text().trim();
      if (text.length < 3) return;
      allHighlights.push(...findWholeWordMatches(body, text, "person", id));
    });
  } catch (_) {}

  try {
    doc.dates().forEach((date: any) => {
      const text = date.text().trim();
      if (text.length < 3) return;
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
  } catch (_) {}

  try {
    doc.money().forEach((m: any) => {
      const text = m.text().trim();
      if (!text) return;
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

  allHighlights.push(
    ...findPatternMatches(body, /[$₹€£¥]\d[\d,.]+/g, "amount", id),
  );

  try {
    doc.sentences().forEach((s: any) => {
      const text = s.text().trim();
      if (!text.includes("?") || text.length < 10) return;
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
  } catch (_) {}

  URGENT_KEYWORDS.forEach((kw) => {
    allHighlights.push(...findWholeWordMatches(body, kw, "urgent", id));
  });

  ACTION_PATTERNS.forEach((pattern) => {
    allHighlights.push(...findPatternMatches(body, pattern, "action_item", id));
  });

  allHighlights.push(
    ...findPatternMatches(body, /\+?\d[\d\s\-().]{8,}\d/g, "phone", id),
  );

  return deduplicateHighlights(
    allHighlights.sort((a, b) => a.startIndex - b.startIndex),
  );
}

function deduplicateHighlights(highlights: Highlight[]): Highlight[] {
  const result: Highlight[] = [];
  let lastEnd = -1;
  for (const h of highlights) {
    if (h.startIndex >= lastEnd && h.text.trim().length > 0) {
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
