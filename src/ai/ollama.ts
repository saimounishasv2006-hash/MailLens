export interface OllamaOptions {
  model?: string;
  temperature?: number;
}

export interface OllamaResponse {
  success: boolean;
  text: string;
  error?: string;
}

const OLLAMA_BASE = "http://localhost:11434";

async function generate(
  prompt: string,
  system: string,
  options: OllamaOptions = {},
): Promise<OllamaResponse> {
  try {
    const model = options.model || (await getDefaultModel());

    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        system,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.3,
          num_predict: 512,
        },
      }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

    const data = await res.json();
    return { success: true, text: data.response?.trim() || "" };
  } catch (err: any) {
    return {
      success: false,
      text: "",
      error: err.message || "Ollama not reachable. Is it running?",
    };
  }
}

export async function isOllamaRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getAvailableModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    const data = await res.json();
    return (data.models || []).map((m: any) => m.name);
  } catch {
    return [];
  }
}

async function getDefaultModel(): Promise<string> {
  const models = await getAvailableModels();
  const preferred = ["llama3.2", "llama3", "mistral", "gemma2", "phi3"];
  for (const p of preferred) {
    const found = models.find((m) => m.startsWith(p));
    if (found) return found;
  }
  return models[0] || "llama3.2";
}

export async function summarizeEmail(
  subject: string,
  body: string,
  model?: string,
): Promise<OllamaResponse> {
  return generate(
    `Subject: ${subject}\n\nEmail:\n${body.slice(0, 3000)}`,
    `You are an email assistant. Summarize the email in 2-3 sentences max. 
Be concise and focus on the key point and any required action. 
Do not use bullet points. Reply with just the summary, nothing else.`,
    { model, temperature: 0.2 },
  );
}

export async function detectTone(
  body: string,
  model?: string,
): Promise<OllamaResponse> {
  return generate(
    `Analyze the tone of this email:\n\n${body.slice(0, 1500)}`,
    `You are an email tone analyzer. Reply with ONLY a JSON object like:
{"tone": "positive"|"negative"|"neutral"|"urgent"|"formal", "confidence": 0-100, "reason": "one short sentence"}
No markdown, no explanation, just the JSON.`,
    { model, temperature: 0.1 },
  );
}

export async function generateReply(
  subject: string,
  body: string,
  style: "professional" | "friendly" | "brief",
  model?: string,
): Promise<OllamaResponse> {
  const styleGuide = {
    professional: "formal and professional tone, full sentences",
    friendly: "warm and friendly tone, conversational",
    brief: "very short, 2-3 sentences max, direct",
  };

  return generate(
    `Subject: ${subject}\n\nOriginal Email:\n${body.slice(0, 2000)}\n\nWrite a reply.`,
    `You are an email writing assistant. Write a reply email in ${styleGuide[style]}.
Do not include subject line. Start directly with the greeting.
Keep it natural and human. Reply with just the email body, nothing else.`,
    { model, temperature: 0.7 },
  );
}

export async function getPriorityScore(
  subject: string,
  body: string,
  model?: string,
): Promise<OllamaResponse> {
  return generate(
    `Subject: ${subject}\n\nEmail:\n${body.slice(0, 1500)}`,
    `You are an email priority analyzer. Rate this email's priority from 0-100.
Reply ONLY with JSON: {"score": 0-100, "reason": "one short sentence"}
High priority (70-100): urgent deadlines, action required, important decisions.
Medium (40-69): needs response, informational but relevant.
Low (0-39): newsletters, notifications, no action needed.
No markdown, just JSON.`,
    { model, temperature: 0.1 },
  );
}
