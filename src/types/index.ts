export type EmailClient =
  | "gmail"
  | "outlook"
  | "yahoo"
  | "protonmail"
  | "fastmail"
  | "unknown";

export interface ParsedEmail {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  body: string;
  timestamp: string;
  client: EmailClient;
}

export interface Highlight {
  id: string;
  emailId: string;
  type: HighlightType;
  text: string;
  startIndex: number;
  endIndex: number;
  color: string;
  tooltip?: string;
}

export type HighlightType =
  | "action_item"
  | "deadline"
  | "person"
  | "amount"
  | "link"
  | "phone"
  | "question"
  | "urgent";

export interface EmailInsight {
  emailId: string;
  summary: string;
  tone: "positive" | "neutral" | "negative" | "urgent" | "formal";
  actionItems: string[];
  keyDates: string[];
  entities: {
    people: string[];
    organizations: string[];
    amounts: string[];
  };
  priorityScore: number; // 0-100
}

export interface MailLensSettings {
  enabled: boolean;
  highlights: Record<HighlightType, boolean>;
  autoSidebar: boolean;
  theme: "light" | "dark" | "system";
}
