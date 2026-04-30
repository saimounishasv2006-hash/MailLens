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

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get("settings");
  if (!existing.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.windows.create({
    url: chrome.runtime.getURL("src/sidebar/index.html"),
    type: "popup",
    width: 380,
    height: 700,
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EMAIL_ANALYZED") {
    chrome.storage.local.set({ latestEmail: message.payload });
  }

  if (message.type === "GET_LATEST_EMAIL") {
    chrome.storage.local.get("latestEmail").then((data) => {
      sendResponse({ payload: data.latestEmail || null });
    });
    return true;
  }

  if (message.type === "GET_SETTINGS") {
    chrome.storage.local.get("settings").then((data) => {
      sendResponse({ settings: data.settings ?? DEFAULT_SETTINGS });
    });
    return true;
  }
});
