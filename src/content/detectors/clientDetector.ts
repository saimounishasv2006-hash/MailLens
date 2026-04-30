import { EmailClient } from "@/types";

interface ClientConfig {
  name: EmailClient;
  emailContainerSelector: string;
  subjectSelector: string;
  senderSelector: string;
  bodySelector: string;
  observerTarget: string;
}

export const CLIENT_CONFIGS: Record<EmailClient, ClientConfig> = {
  gmail: {
    name: "gmail",
    emailContainerSelector: ".tVu25",
    subjectSelector: "h2.hP",
    senderSelector: ".gD",
    bodySelector: ".tVu25",
    observerTarget: ".AO",
  },
  outlook: {
    name: "outlook",
    emailContainerSelector: '[role="main"]',
    subjectSelector: '[data-testid="subject"]',
    senderSelector: '[data-testid="senderName"]',
    bodySelector: ".x_elementToProof, [data-render-id]",
    observerTarget: '[role="main"]',
  },
  yahoo: {
    name: "yahoo",
    emailContainerSelector: ".msg-body",
    subjectSelector: '[data-test-id="message-subject"]',
    senderSelector: '[data-test-id="from-field"]',
    bodySelector: ".msg-body",
    observerTarget: "#message-view-scroller",
  },
  protonmail: {
    name: "protonmail",
    emailContainerSelector: ".proton-root",
    subjectSelector: ".message-subject",
    senderSelector: ".message-header-sender",
    bodySelector: ".proton-root .message-content",
    observerTarget: ".proton-root",
  },
  fastmail: {
    name: "fastmail",
    emailContainerSelector: ".v-MsgBody",
    subjectSelector: ".v-Subject",
    senderSelector: ".v-MsgFrom",
    bodySelector: ".v-MsgBody",
    observerTarget: ".v-MsgBody",
  },
  unknown: {
    name: "unknown",
    emailContainerSelector: '[role="main"]',
    subjectSelector: "h1, h2",
    senderSelector: "",
    bodySelector: '[role="main"]',
    observerTarget: "body",
  },
};

export function detectEmailClient(): EmailClient {
  const host = window.location.hostname;

  if (host.includes("mail.google.com")) return "gmail";
  if (host.includes("outlook.live.com") || host.includes("outlook.office.com"))
    return "outlook";
  if (host.includes("mail.yahoo.com")) return "yahoo";
  if (host.includes("mail.proton.me")) return "protonmail";
  if (host.includes("fastmail.com")) return "fastmail";

  return "unknown";
}

export function getClientConfig(client: EmailClient): ClientConfig {
  return CLIENT_CONFIGS[client];
}
