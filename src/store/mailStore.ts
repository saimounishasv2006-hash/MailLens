import { create } from "zustand";
import {
  ParsedEmail,
  Highlight,
  EmailInsight,
  MailLensSettings,
} from "@/types";

interface MailStore {
  // Current email
  currentEmail: ParsedEmail | null;
  highlights: Highlight[];
  insight: EmailInsight | null;

  // UI state
  sidebarOpen: boolean;
  isAnalyzing: boolean;

  // Settings
  settings: MailLensSettings;

  // Actions
  setCurrentEmail: (email: ParsedEmail) => void;
  setHighlights: (highlights: Highlight[]) => void;
  setInsight: (insight: EmailInsight) => void;
  setSidebarOpen: (open: boolean) => void;
  setIsAnalyzing: (v: boolean) => void;
  setSettings: (settings: MailLensSettings) => void;
  reset: () => void;
}

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

export const useMailStore = create<MailStore>((set) => ({
  currentEmail: null,
  highlights: [],
  insight: null,
  sidebarOpen: false,
  isAnalyzing: false,
  settings: DEFAULT_SETTINGS,

  setCurrentEmail: (email) => set({ currentEmail: email }),
  setHighlights: (highlights) => set({ highlights }),
  setInsight: (insight) => set({ insight }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setSettings: (settings) => set({ settings }),
  reset: () => set({ currentEmail: null, highlights: [], insight: null }),
}));
