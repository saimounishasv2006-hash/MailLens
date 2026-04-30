import { ParsedEmail, EmailClient } from "@/types";

function generateId(): string {
  return `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanText(text: string): string {
  return text
    .replace(/\u200B/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function findEmailBody(): HTMLElement | null {
  const selectors = [
    ".tVu25",
    ".a3s.aiL",
    ".a3s",
    ".ii.gt div",
    "[data-message-id]",
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel) as HTMLElement;
    if (el && el.innerText?.length > 50) return el;
  }

  const divs = Array.from(document.querySelectorAll("div")) as HTMLElement[];
  return (
    divs
      .filter((d) => d.children.length < 10 && (d.innerText?.length || 0) > 200)
      .sort(
        (a, b) => (b.innerText?.length || 0) - (a.innerText?.length || 0),
      )[0] || null
  );
}

export function parseEmail(client: EmailClient): ParsedEmail | null {
  const bodyEl = findEmailBody();
  if (!bodyEl) return null;

  const body = cleanText(bodyEl.innerText || "");
  if (body.length < 20) return null;

  const subjectEl = document.querySelector("h2.hP") as HTMLElement;
  const subject = cleanText(
    subjectEl?.innerText || document.title || "No Subject",
  );

  const senderEl = document.querySelector(".gD") as HTMLElement;
  const senderRaw = cleanText(senderEl?.innerText || "");
  const emailMatch = senderRaw.match(/[\w.-]+@[\w.-]+\.\w+/);
  const senderEmail = emailMatch ? emailMatch[0] : "";
  const sender =
    senderRaw
      .replace(emailMatch?.[0] || "", "")
      .replace(/[<>]/g, "")
      .trim() || senderEmail;

  return {
    id: generateId(),
    subject,
    sender,
    senderEmail,
    body,
    timestamp: new Date().toISOString(),
    client,
  };
}
