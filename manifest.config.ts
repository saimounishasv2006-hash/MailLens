import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "MailLens — Smart Email Intelligence",
  version: "1.0.0",
  description:
    "AI-powered email highlights, summaries, and insights — 100% local",
  permissions: ["storage", "activeTab", "scripting"],
  host_permissions: [
    "https://mail.google.com/*",
    "https://outlook.live.com/*",
    "https://outlook.office.com/*",
    "https://mail.yahoo.com/*",
    "https://mail.proton.me/*",
    "https://app.fastmail.com/*",
    "http://localhost:11434/*",
  ],
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: [
        "https://mail.google.com/*",
        "https://outlook.live.com/*",
        "https://outlook.office.com/*",
        "https://mail.yahoo.com/*",
        "https://mail.proton.me/*",
        "https://app.fastmail.com/*",
      ],
      js: ["src/content/index.tsx"],
      css: ["src/content/content.css"],
      run_at: "document_idle",
    },
  ],
  action: {},
  web_accessible_resources: [
    {
      resources: ["src/sidebar/index.html"],
      matches: ["<all_urls>"],
    },
  ],
});
