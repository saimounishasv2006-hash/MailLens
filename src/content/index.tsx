import { detectEmailClient, getClientConfig } from "./detectors/clientDetector";
import { parseEmail, findEmailBody } from "./parsers/emailParser";
import { extractHighlights } from "./parsers/nlpParser";
import {
  injectHighlights,
  injectGlobalStyles,
  clearHighlights,
  rerenderOverlay,
} from "./highlighters/domHighlighter";
import { EmailClient } from "@/types";

console.log("[MailLens] v2 loaded");

let currentClient: EmailClient;
let observer: MutationObserver | null = null;
let lastProcessedText = "";
let scrollRAF: number | null = null;

function init() {
  injectGlobalStyles();

  currentClient = detectEmailClient();
  const config = getClientConfig(currentClient);

  const observerTarget = document.querySelector(config.observerTarget);
  if (!observerTarget) {
    setTimeout(init, 1500);
    return;
  }

  observer = new MutationObserver(() => {
    const emailBody = findEmailBody();
    if (!emailBody) return;

    const currentText = emailBody.innerText?.slice(0, 200) || "";
    if (currentText === lastProcessedText) return;
    lastProcessedText = currentText;

    onEmailOpened(emailBody);
  });

  observer.observe(observerTarget, { childList: true, subtree: true });

  window.addEventListener(
    "scroll",
    () => {
      if (scrollRAF) cancelAnimationFrame(scrollRAF);
      scrollRAF = requestAnimationFrame(() => {
        rerenderOverlay();
      });
    },
    { passive: true },
  );

  const gmailScroller = document.querySelector(".Tm.aeJ") as HTMLElement;
  if (gmailScroller) {
    gmailScroller.addEventListener(
      "scroll",
      () => {
        if (scrollRAF) cancelAnimationFrame(scrollRAF);
        scrollRAF = requestAnimationFrame(() => {
          rerenderOverlay();
        });
      },
      { passive: true },
    );
  }

  console.log(`[MailLens] Watching ${currentClient}`);
}

async function onEmailOpened(emailElement: HTMLElement) {
  const email = parseEmail(currentClient);
  if (!email || email.body.length < 20) return;

  console.log("[MailLens] Parsed email:", email.subject);

  const highlights = extractHighlights(email);
  injectHighlights(emailElement, highlights);

  chrome.runtime.sendMessage({
    type: "EMAIL_ANALYZED",
    payload: { email, highlights },
  });

  console.log(`[MailLens] Injected ${highlights.length} highlights`);
}

init();
