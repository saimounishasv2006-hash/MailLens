import { detectEmailClient, getClientConfig } from "./detectors/clientDetector";
import { parseEmail } from "./parsers/emailParser";
import { extractHighlights } from "./parsers/nlpParser";
import { injectHighlights } from "./highlighters/domHighlighter";
import { EmailClient } from "@/types";

console.log("[MailLens] v2 loaded");

let currentClient: EmailClient;
let observer: MutationObserver | null = null;
let lastProcessedText = "";

function init() {
  currentClient = detectEmailClient();
  const config = getClientConfig(currentClient);

  const observerTarget = document.querySelector(config.observerTarget);
  if (!observerTarget) {
    setTimeout(init, 1500);
    return;
  }

  observer = new MutationObserver(() => {
    const emailBody = document.querySelector(
      config.bodySelector,
    ) as HTMLElement;
    if (!emailBody) return;

    const currentText = emailBody.innerText?.slice(0, 200) || "";
    if (currentText === lastProcessedText) return; // already processed
    lastProcessedText = currentText;

    onEmailOpened(emailBody);
  });

  observer.observe(observerTarget, { childList: true, subtree: true });
  console.log(`[MailLens] Watching ${currentClient}`);
}

async function onEmailOpened(emailElement: HTMLElement) {
  const email = parseEmail(currentClient);
  if (!email || email.body.length < 20) return;

  console.log("[MailLens] Parsed email:", email.subject);

  // Extract highlights with NLP
  const highlights = extractHighlights(email);

  // Inject into DOM
  injectHighlights(emailElement, highlights);

  // Notify sidebar
  chrome.runtime.sendMessage({
    type: "EMAIL_ANALYZED",
    payload: { email, highlights },
  });

  console.log(`[MailLens] Injected ${highlights.length} highlights`);
}

init();
