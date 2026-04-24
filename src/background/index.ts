import { MailLensSettings } from "@/types";

const DEFAULT_SETTINGS: MailLensSettings = {
  enabled: true,
  highlights: {
    action_item: true,
    deadline: true,
    person: true,
    amount: true,
    link: true,
    phone: true,
    question: true,
    urgent: true,
  },
  autoSidebar: false,
  theme: "system",
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get("settings");
  if (!existing.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  console.log("[MailLens] Extension installed & ready");
});

// Open side panel when icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Message bridge between content script and popup/sidebar
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_SETTINGS") {
    chrome.storage.local.get("settings").then((data) => {
      sendResponse({ settings: data.settings ?? DEFAULT_SETTINGS });
    });
    return true; // keep channel open for async
  }

  if (message.type === "SAVE_SETTINGS") {
    chrome.storage.local.set({ settings: message.payload }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
