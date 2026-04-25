import { ParsedEmail, EmailClient } from "@/types";
import { getClientConfig } from "../detectors/clientDetector";

function generateId(): string {
  return `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanText(text: string): string {
  return text
    .replace(/\u200B/g, "") // zero-width spaces
    .replace(/\s+/g, " ")
    .trim();
}

export function parseEmail(client: EmailClient): ParsedEmail | null {
  const config = getClientConfig(client);

  const bodyEl = document.querySelector(config.bodySelector);
  const subjectEl = document.querySelector(config.subjectSelector);
  const senderEl = document.querySelector(config.senderSelector);

  if (!bodyEl) return null;

  const body = cleanText((bodyEl as HTMLElement).innerText || "");
  const subject = cleanText(
    (subjectEl as HTMLElement)?.innerText || "No Subject",
  );

  // Parse sender name + email
  const senderRaw = cleanText((senderEl as HTMLElement)?.innerText || "");
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
