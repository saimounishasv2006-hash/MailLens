import { detectEmailClient, getClientConfig } from "./detectors/clientDetector";
import { EmailClient } from "@/types";

console.log("[MailLens] Content script loaded");

let currentClient: EmailClient;
let observer: MutationObserver | null = null;

function init() {
  currentClient = detectEmailClient();
  const config = getClientConfig(currentClient);

  console.log(`[MailLens] Detected email client: ${currentClient}`);

  // Watch for email open events via DOM mutation
  const observerTarget = document.querySelector(config.observerTarget);
  if (!observerTarget) {
    // Retry after DOM loads more
    setTimeout(init, 1500);
    return;
  }

  observer = new MutationObserver(() => {
    const emailBody = document.querySelector(config.bodySelector);
    if (emailBody && !emailBody.getAttribute("data-maillens-processed")) {
      emailBody.setAttribute("data-maillens-processed", "true");
      onEmailOpened(emailBody as HTMLElement);
    }
  });

  observer.observe(observerTarget, {
    childList: true,
    subtree: true,
  });

  console.log("[MailLens] Observer active — waiting for emails");
}

function onEmailOpened(emailElement: HTMLElement) {
  console.log("[MailLens] Email opened, ready to analyze");

  // Phase 2: we'll add parsing + highlighting here
  // For now just mark it
  emailElement.style.outline = "2px solid rgba(99, 102, 241, 0.3)";

  // Notify background/sidebar
  chrome.runtime.sendMessage({
    type: "EMAIL_OPENED",
    payload: {
      client: currentClient,
      bodyText: emailElement.innerText?.slice(0, 5000), // cap at 5k chars
    },
  });
}

// Kick off
init();
