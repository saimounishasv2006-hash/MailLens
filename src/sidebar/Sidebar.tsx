import { useEffect, useState } from "react";
import { ParsedEmail, Highlight, HighlightType } from "@/types";

const TYPE_META: Record<
  HighlightType,
  { label: string; emoji: string; color: string }
> = {
  action_item: { label: "Action Items", emoji: "✅", color: "#6366f1" },
  deadline: { label: "Deadlines", emoji: "📅", color: "#ef4444" },
  person: { label: "People", emoji: "👤", color: "#10b981" },
  amount: { label: "Amounts", emoji: "💰", color: "#f59e0b" },
  link: { label: "Links", emoji: "🔗", color: "#3b82f6" },
  phone: { label: "Phone Numbers", emoji: "📞", color: "#8b5cf6" },
  question: { label: "Questions", emoji: "❓", color: "#ec4899" },
  urgent: { label: "Urgent", emoji: "🔴", color: "#ef4444" },
};

export default function Sidebar() {
  const [email, setEmail] = useState<ParsedEmail | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeTab, setActiveTab] = useState<"highlights" | "summary">(
    "highlights",
  );

  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "EMAIL_ANALYZED") {
        setEmail(msg.payload.email);
        setHighlights(msg.payload.highlights);
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
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #1e1b4b",
          background: "linear-gradient(135deg, #1e1b4b, #0f0f1a)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🔍</span>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "#a5b4fc" }}>
            MailLens
          </span>
        </div>
        {email && (
          <div style={{ marginTop: "8px" }}>
            <div
              style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}
            >
              {email.subject}
            </div>
            <div
              style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}
            >
              From {email.sender || email.senderEmail}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e1b4b" }}>
        {(["highlights", "summary"] as const).map((tab) => (
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
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {!email ? (
          <div
            style={{ textAlign: "center", marginTop: "60px", color: "#475569" }}
          >
            <div style={{ fontSize: "32px" }}>📭</div>
            <div style={{ marginTop: "8px", fontSize: "13px" }}>
              Open an email to see insights
            </div>
          </div>
        ) : activeTab === "highlights" ? (
          <div>
            {/* Stats row */}
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

            {/* Grouped highlights */}
            {(Object.keys(grouped) as HighlightType[]).map((type) => (
              <HighlightGroup
                key={type}
                type={type}
                highlights={grouped[type]}
              />
            ))}
          </div>
        ) : (
          <SummaryTab email={email} highlights={highlights} />
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

function SummaryTab({
  email,
  highlights,
}: {
  email: ParsedEmail;
  highlights: Highlight[];
}) {
  const people = highlights
    .filter((h) => h.type === "person")
    .map((h) => h.text);
  const deadlines = highlights
    .filter((h) => h.type === "deadline")
    .map((h) => h.text);
  const actions = highlights
    .filter((h) => h.type === "action_item")
    .map((h) => h.text);
  const amounts = highlights
    .filter((h) => h.type === "amount")
    .map((h) => h.text);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Section title="📝 Email Info">
        <Row label="Subject" value={email.subject} />
        <Row label="From" value={email.sender || email.senderEmail} />
        <Row label="Client" value={email.client} />
      </Section>

      {actions.length > 0 && (
        <Section title="✅ Action Items">
          {[...new Set(actions)].map((a, i) => (
            <div
              key={i}
              style={{
                fontSize: "12px",
                color: "#a5b4fc",
                padding: "3px 0",
                borderBottom: "1px solid #1e1b4b",
              }}
            >
              • {a}
            </div>
          ))}
        </Section>
      )}

      {deadlines.length > 0 && (
        <Section title="📅 Key Dates">
          {[...new Set(deadlines)].map((d, i) => (
            <div
              key={i}
              style={{ fontSize: "12px", color: "#fca5a5", padding: "3px 0" }}
            >
              • {d}
            </div>
          ))}
        </Section>
      )}

      {people.length > 0 && (
        <Section title="👥 People Mentioned">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {[...new Set(people)].map((p, i) => (
              <span
                key={i}
                style={{
                  background: "#064e3b",
                  color: "#6ee7b7",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "11px",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </Section>
      )}

      {amounts.length > 0 && (
        <Section title="💰 Amounts">
          {[...new Set(amounts)].map((a, i) => (
            <div
              key={i}
              style={{ fontSize: "12px", color: "#fde68a", padding: "3px 0" }}
            >
              • {a}
            </div>
          ))}
        </Section>
      )}

      <div
        style={{
          marginTop: "8px",
          padding: "10px",
          background: "#1e1b4b",
          borderRadius: "8px",
          fontSize: "11px",
          color: "#64748b",
          textAlign: "center",
        }}
      >
        🤖 AI Summary coming in Phase 3 (Ollama)
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ background: "#1a1a2e", borderRadius: "8px", padding: "10px" }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#94a3b8",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "12px",
        padding: "3px 0",
      }}
    >
      <span style={{ color: "#64748b" }}>{label}</span>
      <span
        style={{
          color: "#e2e8f0",
          maxWidth: "180px",
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}
