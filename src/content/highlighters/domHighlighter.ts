import { Highlight } from "@/types";

const OVERLAY_ID = "maillens-overlay-container";

export function injectGlobalStyles(): void {
  if (document.getElementById("maillens-styles")) return;
  const style = document.createElement("style");
  style.id = "maillens-styles";
  style.textContent = `
    #maillens-overlay-container {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      pointer-events: none;
      z-index: 9999;
    }
    .maillens-hl {
      position: fixed;
      pointer-events: auto;
      cursor: pointer;
      border-radius: 3px;
      opacity: 0.45;
    }
    .maillens-hl:hover { opacity: 0.75; }
    #maillens-tooltip {
      position: fixed;
      z-index: 99999;
      background: #1e1b4b;
      color: white;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-family: sans-serif;
      pointer-events: none;
      white-space: nowrap;
      transition: opacity 0.15s;
      opacity: 0;
    }
  `;
  document.head.appendChild(style);
}

function getOrCreateTooltip(): HTMLDivElement {
  let t = document.getElementById("maillens-tooltip") as HTMLDivElement;
  if (!t) {
    t = document.createElement("div");
    t.id = "maillens-tooltip";
    document.body.appendChild(t);
  }
  return t;
}

function getHighlightColor(type: string): string {
  const map: Record<string, string> = {
    action_item: "#6366f1",
    deadline: "#ef4444",
    person: "#10b981",
    amount: "#f59e0b",
    link: "#3b82f6",
    phone: "#8b5cf6",
    question: "#ec4899",
    urgent: "#ef4444",
  };
  return map[type] || "#94a3b8";
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    action_item: "Action Item",
    deadline: "Deadline",
    person: "Person",
    amount: "Amount",
    link: "Link",
    phone: "Phone",
    question: "Question",
    urgent: "Urgent",
  };
  return map[type] || type;
}

function findTextRange(
  container: HTMLElement,
  searchText: string,
): Range | null {
  if (!searchText.trim()) return null;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let accumulated = "";
  const nodes: { node: Text; start: number }[] = [];

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    nodes.push({ node, start: accumulated.length });
    accumulated += node.textContent || "";
  }

  const idx = accumulated.indexOf(searchText);
  if (idx === -1) return null;

  const end = idx + searchText.length;
  const range = document.createRange();
  let startSet = false;

  for (const { node, start } of nodes) {
    const nodeEnd = start + (node.textContent?.length || 0);
    if (!startSet && idx >= start && idx < nodeEnd) {
      range.setStart(node, idx - start);
      startSet = true;
    }
    if (startSet && end > start && end <= nodeEnd) {
      range.setEnd(node, end - start);
      return range;
    }
  }
  return null;
}

let currentHighlights: Highlight[] = [];
let currentContainer: HTMLElement | null = null;

export function injectHighlights(
  container: HTMLElement,
  highlights: Highlight[],
): void {
  currentHighlights = highlights;
  currentContainer = container;
  renderOverlay();
}

function renderOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove();

  if (currentHighlights.length === 0 || !currentContainer) return;

  const tooltip = getOrCreateTooltip();

  const overlayContainer = document.createElement("div");
  overlayContainer.id = OVERLAY_ID;
  document.body.appendChild(overlayContainer);

  let injectedCount = 0;

  for (const highlight of currentHighlights) {
    const range = findTextRange(currentContainer, highlight.text);
    if (!range) continue;

    const rects = Array.from(range.getClientRects());

    for (const rect of rects) {
      if (rect.width < 1 || rect.height < 1) continue;

      const hl = document.createElement("div");
      hl.className = "maillens-hl";
      hl.style.left = `${rect.left}px`;
      hl.style.top = `${rect.top}px`;
      hl.style.width = `${rect.width}px`;
      hl.style.height = `${rect.height}px`;
      hl.style.background = getHighlightColor(highlight.type);
      hl.style.borderBottom = `2px solid ${getHighlightColor(highlight.type)}`;

      hl.addEventListener("mouseenter", (e) => {
        tooltip.textContent = getTypeLabel(highlight.type);
        tooltip.style.opacity = "1";
        tooltip.style.left = `${(e as MouseEvent).clientX + 10}px`;
        tooltip.style.top = `${(e as MouseEvent).clientY - 28}px`;
      });
      hl.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
      });

      overlayContainer.appendChild(hl);
      injectedCount++;
    }
  }
}

export function clearHighlights(_container: HTMLElement): void {
  document.getElementById(OVERLAY_ID)?.remove();
  currentHighlights = [];
  currentContainer = null;
}

export function rerenderOverlay(): void {
  renderOverlay();
}
