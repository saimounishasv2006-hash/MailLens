import { Highlight } from "@/types";

const TOOLTIP_ID = "maillens-tooltip";

function getOrCreateTooltip(): HTMLDivElement {
  let tooltip = document.getElementById(TOOLTIP_ID) as HTMLDivElement;
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = TOOLTIP_ID;
    tooltip.style.cssText = `
      position: fixed;
      z-index: 99999;
      background: #1e1b4b;
      color: white;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-family: sans-serif;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      white-space: nowrap;
    `;
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

export function injectHighlights(
  container: HTMLElement,
  highlights: Highlight[],
): void {
  clearHighlights(container);

  if (highlights.length === 0) return;

  const tooltip = getOrCreateTooltip();

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
  );

  const textNodes: { node: Text; start: number }[] = [];
  let offset = 0;

  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    textNodes.push({ node, start: offset });
    offset += node.textContent?.length ?? 0;
  }

  for (const highlight of [...highlights].reverse()) {
    for (const { node, start } of [...textNodes].reverse()) {
      const nodeText = node.textContent || "";
      const nodeEnd = start + nodeText.length;

      if (highlight.startIndex >= start && highlight.endIndex <= nodeEnd) {
        const localStart = highlight.startIndex - start;
        const localEnd = highlight.endIndex - start;

        const before = nodeText.slice(0, localStart);
        const match = nodeText.slice(localStart, localEnd);
        const after = nodeText.slice(localEnd);

        const span = document.createElement("mark");
        span.setAttribute("data-maillens-highlight", highlight.type);
        span.setAttribute("data-maillens-id", highlight.id);
        span.style.cssText = `
  background: ${highlight.color} !important;
  border-radius: 3px !important;
  padding: 0 2px !important;
  cursor: pointer !important;
  display: inline !important;
  color: inherit !important;
  font-size: inherit !important;
  font-family: inherit !important;
  -webkit-text-fill-color: inherit !important;
  border-bottom: 2.5px solid ${highlight.color.replace(/[\d.]+\)$/, "1)")} !important;
  text-decoration: none !important;
  position: relative !important;
  z-index: 9999 !important;
`;
        span.textContent = match;

        span.addEventListener("mouseenter", (e) => {
          if (highlight.tooltip) {
            tooltip.textContent = `${getTypeEmoji(highlight.type)} ${highlight.tooltip}`;
            tooltip.style.opacity = "1";
            tooltip.style.left = `${(e as MouseEvent).clientX + 10}px`;
            tooltip.style.top = `${(e as MouseEvent).clientY - 28}px`;
          }
        });
        span.addEventListener("mouseleave", () => {
          tooltip.style.opacity = "0";
        });

        const fragment = document.createDocumentFragment();
        if (before) fragment.appendChild(document.createTextNode(before));
        fragment.appendChild(span);
        if (after) fragment.appendChild(document.createTextNode(after));

        node.parentNode?.replaceChild(fragment, node);
        break;
      }
    }
  }
}

export function clearHighlights(container: HTMLElement): void {
  container.querySelectorAll("[data-maillens-highlight]").forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent || ""), el);
      parent.normalize();
    }
  });
}

function getTypeEmoji(type: string): string {
  const map: Record<string, string> = {
    action_item: "✅",
    deadline: "📅",
    person: "👤",
    amount: "💰",
    link: "🔗",
    phone: "📞",
    question: "❓",
    urgent: "🔴",
  };
  return map[type] || "•";
}
