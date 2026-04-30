export default function Popup() {
  return (
    <div
      style={{
        width: "280px",
        padding: "16px",
        background: "#0f0f1a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "22px" }}></span>
        <div>
          <div style={{ fontWeight: 700, color: "#a5b4fc" }}>MailLens</div>
          <div style={{ fontSize: "11px", color: "#475569" }}>
            Smart Email Intelligence
          </div>
        </div>
      </div>
      <div
        style={{
          background: "#1e1b4b",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        Open an email on Gmail, Outlook, or Yahoo to see highlights
      </div>
      <div
        style={{
          marginTop: "10px",
          fontSize: "11px",
          color: "#334155",
          textAlign: "center",
        }}
      >
        Phase 3 will add Ollama AI controls here
      </div>
    </div>
  );
}
