# MailLens

AI-powered email intelligence that runs 100% locally. No servers. No tracking. Nothing leaves your machine.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Manifest](https://img.shields.io/badge/manifest-v3-orange)

---

## What it does

MailLens sits on top of your inbox and gives you instant insights on every email you open.

- **Smart Highlights** — automatically marks people, dates, amounts, questions, action items, and urgent keywords directly in the email body
- **AI Summary** — generates a 2-3 sentence TL;DR of any email
- **Tone Detection** — tells you if the email is positive, negative, neutral, urgent, or formal
- **Priority Score** — rates the email 0-100 so you know what needs attention
- **Smart Reply** — drafts a reply in professional, friendly, or brief style
- **100% Local** — all AI runs through Ollama on your own machine

---

## Supported Email Clients

- Gmail
- Outlook (Live & Office)
- Yahoo Mail
- ProtonMail
- Fastmail

---

## Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Extension | Chrome MV3 + CRXJS           |
| Frontend  | React 18 + TypeScript + Vite |
| Styling   | Tailwind CSS                 |
| State     | Zustand                      |
| NLP       | compromise.js                |
| AI        | Ollama (llama3.2)            |

---

## Requirements

- [Ollama](https://ollama.com) installed and running
- `llama3.2` model pulled
- Opera, Chrome, or any Chromium-based browser
- Node.js 18+

---

## Getting Started

**1. Clone the repo**

```bash
git clone https://github.com/Prabodh-dev/maillens.git
cd maillens
```

**2. Install dependencies**

```bash
npm install
```

**3. Build the extension**

```bash
npm run dev
```

**4. Load in browser**

- Go to `chrome://extensions` or `opera://extensions`
- Enable Developer Mode
- Click Load unpacked
- Select the `dist/` folder

**5. Start Ollama**

```bash
ollama pull llama3.2
ollama serve
```

**6. Open Gmail and click the MailLens icon**

---

## How it works

```
Email opens in browser
       |
Content script detects it
       |
compromise.js extracts entities locally
       |
Overlay highlights injected into page
       |
Click MailLens icon -> sidebar opens
       |
Ollama (localhost:11434) runs AI features
       |
Summary / Tone / Priority / Reply generated
```

---

## Privacy

MailLens is built privacy-first by design.

- No backend server
- No analytics or telemetry
- No API keys required
- Email content never leaves your machine
- AI inference runs entirely on localhost via Ollama

---

## Project Structure

```
src/
├── background/        # Service worker
├── content/
│   ├── detectors/     # Email client detection
│   ├── parsers/       # Email + NLP parsing
│   └── highlighters/  # DOM overlay engine
├── sidebar/           # AI sidebar UI
├── popup/             # Extension popup
├── ai/                # Ollama integration
├── store/             # Zustand state
└── types/             # TypeScript types
```

---

## License

MIT
