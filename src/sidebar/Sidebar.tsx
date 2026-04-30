import { useEffect, useState } from "react";
import { ParsedEmail, Highlight, HighlightType } from "@/types";
import {
  summarizeEmail,
  detectTone,
  generateReply,
  getPriorityScore,
  isOllamaRunning,
  getAvailableModels,
} from "@/ai/ollama";

const TYPE_META: Record<
  HighlightType,
  { label: string; emoji: string; color: string }
> = {
  action_item: { label: "Action Items", emoji: "", color: "#6366f1" },
  deadline: { label: "Deadlines", emoji: "", color: "#ef4444" },
  person: { label: "People", emoji: "", color: "#10b981" },
  amount: { label: "Amounts", emoji: "", color: "#f59e0b" },
  link: { label: "Links", emoji: "", color: "#3b82f6" },
  phone: { label: "Phone Numbers", emoji: "", color: "#8b5cf6" },
  question: { label: "Questions", emoji: "", color: "#ec4899" },
  urgent: { label: "Urgent", emoji: "", color: "#ef4444" },
};

const TONE_META = {
  positive: { emoji: "", color: "#10b981", label: "Positive" },
  negative: { emoji: "", color: "#ef4444", label: "Negative" },
  neutral: { emoji: "", color: "#94a3b8", label: "Neutral" },
  urgent: { emoji: "", color: "#f59e0b", label: "Urgent" },
  formal: { emoji: "", color: "#6366f1", label: "Formal" },
};

export default function Sidebar() {
  const [email, setEmail] = useState<ParsedEmail | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeTab, setActiveTab] = useState<"highlights" | "ai">("highlights");

  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [summary, setSummary] = useState("");
  const [tone, setTone] = useState<any>(null);
  const [priority, setPriority] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [replyStyle, setReplyStyle] = useState<
    "professional" | "friendly" | "brief"
  >("professional");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    isOllamaRunning().then(setOllamaOk);
    getAvailableModels().then((m) => {
      setModels(m);
      if (m.length > 0) setSelectedModel(m[0]);
    });

    chrome.runtime.sendMessage({ type: "GET_LATEST_EMAIL" }, (response) => {
      if (response?.payload) {
        setEmail(response.payload.email);
        setHighlights(response.payload.highlights);
      }
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.latestEmail?.newValue) {
        const { email, highlights } = changes.latestEmail.newValue;
        setEmail(email);
        setHighlights(highlights);
        setSummary("");
        setTone(null);
        setPriority(null);
        setReply("");
      }
    });
  }, []);

  const grouped = highlights.reduce(
    (acc, h) => {
      if (!acc[h.type]) acc[h.type] = [];
      acc[h.type].push(h);
      return acc;
    },
    {} as Record<HighlightType, Highlight[]>,
  );

  async function runSummary() {
    if (!email) return;
    setLoadingAction("summary");
    const res = await summarizeEmail(email.subject, email.body, selectedModel);
    setSummary(res.success ? res.text : `Error: ${res.error}`);
    setLoadingAction(null);
  }

  async function runTone() {
    if (!email) return;
    setLoadingAction("tone");
    const res = await detectTone(email.body, selectedModel);
    if (res.success) {
      try {
        setTone(JSON.parse(res.text));
      } catch {
        setTone({ tone: "neutral", confidence: 0, reason: res.text });
      }
    }
    setLoadingAction(null);
  }

  async function runPriority() {
    if (!email) return;
    setLoadingAction("priority");
    const res = await getPriorityScore(
      email.subject,
      email.body,
      selectedModel,
    );
    if (res.success) {
      try {
        setPriority(JSON.parse(res.text));
      } catch {
        setPriority({ score: 50, reason: res.text });
      }
    }
    setLoadingAction(null);
  }

  async function runReply() {
    if (!email) return;
    setLoadingAction("reply");
    const res = await generateReply(
      email.subject,
      email.body,
      replyStyle,
      selectedModel,
    );
    setReply(res.success ? res.text : `Error: ${res.error}`);
    setLoadingAction(null);
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0f0f1a",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #1e1b4b",
          background: "linear-gradient(135deg, #1e1b4b, #0f0f1a)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}></span>
            <span
              style={{ fontWeight: 700, fontSize: "15px", color: "#a5b4fc" }}
            >
              MailLens
            </span>
          </div>
          {ollamaOk !== null && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 7px",
                borderRadius: "10px",
                background: ollamaOk ? "#064e3b" : "#450a0a",
                color: ollamaOk ? "#6ee7b7" : "#fca5a5",
              }}
            >
              {ollamaOk ? "Ollama" : "Ollama offline"}
            </span>
          )}
        </div>
        {email && (
          <div style={{ marginTop: "8px" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#e2e8f0",
                lineHeight: 1.3,
              }}
            >
              {email.subject}
            </div>
            <div
              style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}
            >
              {email.sender || email.senderEmail}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #1e1b4b" }}>
        {(["highlights", "ai"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "10px",
              background: activeTab === tab ? "#1e1b4b" : "transparent",
              border: "none",
              color: activeTab === tab ? "#a5b4fc" : "#64748b",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tab === "highlights" ? "Highlights" : "AI"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {!email ? (
          <div
            style={{ textAlign: "center", marginTop: "60px", color: "#475569" }}
          >
            <div style={{ fontSize: "32px" }}></div>
            <div style={{ marginTop: "8px", fontSize: "13px" }}>
              Open an email to see insights
            </div>
          </div>
        ) : activeTab === "highlights" ? (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <StatCard
                label="Highlights"
                value={highlights.length}
                color="#6366f1"
              />
              <StatCard
                label="Action Items"
                value={grouped.action_item?.length || 0}
                color="#10b981"
              />
              <StatCard
                label="Deadlines"
                value={grouped.deadline?.length || 0}
                color="#ef4444"
              />
              <StatCard
                label="Urgent"
                value={grouped.urgent?.length || 0}
                color="#f59e0b"
              />
            </div>

            {Object.keys(grouped).length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#475569",
                  fontSize: "12px",
                  marginTop: "20px",
                }}
              >
                No highlights found in this email
              </div>
            )}

            {(Object.keys(grouped) as HighlightType[]).map((type) => (
              <HighlightGroup
                key={type}
                type={type}
                highlights={grouped[type]}
              />
            ))}
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                background: "#1a1a2e",
                borderRadius: "8px",
                padding: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "6px",
                }}
              >
                Model
              </div>
              {models.length > 0 ? (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#0f172a",
                    color: "#e2e8f0",
                    border: "1px solid #1e1b4b",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    fontSize: "12px",
                  }}
                >
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: "11px", color: "#ef4444" }}>
                  No models found. Run: <code>ollama pull llama3.2</code>
                </div>
              )}
            </div>

            <AICard
              title="Summary"
              onRun={runSummary}
              loading={loadingAction === "summary"}
              disabled={!ollamaOk}
            >
              {summary && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#cbd5e1",
                    lineHeight: 1.6,
                  }}
                >
                  {summary}
                </div>
              )}
            </AICard>

            <AICard
              title="Tone Detection"
              onRun={runTone}
              loading={loadingAction === "tone"}
              disabled={!ollamaOk}
            >
              {tone && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>
                      {TONE_META[tone.tone as keyof typeof TONE_META]?.emoji ||
                        ""}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          TONE_META[tone.tone as keyof typeof TONE_META]
                            ?.color || "#94a3b8",
                        fontSize: "14px",
                      }}
                    >
                      {tone.tone?.charAt(0).toUpperCase() + tone.tone?.slice(1)}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        marginLeft: "auto",
                      }}
                    >
                      {tone.confidence}% confident
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {tone.reason}
                  </div>
                </div>
              )}
            </AICard>

            <AICard
              title="Priority Score"
              onRun={runPriority}
              loading={loadingAction === "priority"}
              disabled={!ollamaOk}
            >
              {priority && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color:
                          priority.score > 70
                            ? "#ef4444"
                            : priority.score > 40
                              ? "#f59e0b"
                              : "#10b981",
                      }}
                    >
                      {priority.score}/100
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background:
                          priority.score > 70
                            ? "#450a0a"
                            : priority.score > 40
                              ? "#451a03"
                              : "#064e3b",
                        color:
                          priority.score > 70
                            ? "#fca5a5"
                            : priority.score > 40
                              ? "#fde68a"
                              : "#6ee7b7",
                      }}
                    >
                      {priority.score > 70
                        ? "High"
                        : priority.score > 40
                          ? "Medium"
                          : "Low"}
                    </div>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: "#1e1b4b",
                      borderRadius: "2px",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${priority.score}%`,
                        borderRadius: "2px",
                        background:
                          priority.score > 70
                            ? "#ef4444"
                            : priority.score > 40
                              ? "#f59e0b"
                              : "#10b981",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {priority.reason}
                  </div>
                </div>
              )}
            </AICard>

            <AICard
              title="Smart Reply"
              onRun={runReply}
              loading={loadingAction === "reply"}
              disabled={!ollamaOk}
              extra={
                <div
                  style={{ display: "flex", gap: "4px", marginBottom: "8px" }}
                >
                  {(["professional", "friendly", "brief"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setReplyStyle(s)}
                      style={{
                        flex: 1,
                        padding: "4px",
                        background: replyStyle === s ? "#6366f1" : "#0f172a",
                        border: "1px solid #1e1b4b",
                        borderRadius: "4px",
                        color: replyStyle === s ? "white" : "#64748b",
                        fontSize: "10px",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              }
            >
              {reply && (
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#cbd5e1",
                      lineHeight: 1.6,
                      background: "#0f172a",
                      borderRadius: "6px",
                      padding: "8px",
                      whiteSpace: "pre-wrap",
                      maxHeight: "160px",
                      overflowY: "auto",
                    }}
                  >
                    {reply}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(reply)}
                    style={{
                      marginTop: "6px",
                      width: "100%",
                      padding: "6px",
                      background: "#1e1b4b",
                      border: "none",
                      borderRadius: "6px",
                      color: "#a5b4fc",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </AICard>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#1e1b4b",
        borderRadius: "8px",
        padding: "10px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "22px", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{label}</div>
    </div>
  );
}

function HighlightGroup({
  type,
  highlights,
}: {
  type: HighlightType;
  highlights: Highlight[];
}) {
  const meta = TYPE_META[type];
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: "8px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1a1a2e",
          border: "none",
          borderRadius: "6px",
          padding: "8px 10px",
          cursor: "pointer",
          color: "#e2e8f0",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600 }}>
          {meta.emoji} {meta.label}
        </span>
        <span
          style={{
            background: meta.color,
            color: "white",
            borderRadius: "10px",
            padding: "1px 7px",
            fontSize: "11px",
          }}
        >
          {highlights.length}
        </span>
      </button>
      {open && (
        <div
          style={{
            marginTop: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {highlights.map((h) => (
            <div
              key={h.id}
              style={{
                background: "#0f172a",
                border: `1px solid ${meta.color}40`,
                borderLeft: `3px solid ${meta.color}`,
                borderRadius: "4px",
                padding: "6px 10px",
                fontSize: "12px",
                color: "#cbd5e1",
              }}
            >
              {h.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AICard({
  title,
  onRun,
  loading,
  disabled,
  children,
  extra,
}: {
  title: string;
  onRun: () => void;
  loading: boolean;
  disabled: boolean;
  children?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div
      style={{ background: "#1a1a2e", borderRadius: "8px", padding: "10px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>
          {title}
        </span>
        <button
          onClick={onRun}
          disabled={disabled || loading}
          style={{
            padding: "4px 10px",
            background: disabled ? "#1e1b4b" : "#6366f1",
            border: "none",
            borderRadius: "6px",
            color: disabled ? "#475569" : "white",
            fontSize: "11px",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⏳ Running..." : "Run"}
        </button>
      </div>
      {extra}
      {children}
      {disabled && (
        <div style={{ fontSize: "10px", color: "#ef4444" }}>
          Start Ollama to use AI features
        </div>
      )}
    </div>
  );
}
