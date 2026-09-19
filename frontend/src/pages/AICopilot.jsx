import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMerchantContext } from "../context/MerchantContext";
import { useCopilot } from "../hooks/useCopilot";
import { getBusinessTypeInfo } from "../utils/formatters";
import { fetchMerchantActions, approveAction } from "../services/api";

// ─── Clean Markdown & Asterisk-Free Formatter ────────────────────────────────
function renderFormattedInline(text) {
  if (!text) return null;
  // Match **bold**, `code`, etc.
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2).replace(/\*\*/g, "");
      return (
        <strong key={index} className="font-semibold text-white">
          {inner}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-emerald-300 font-mono text-xs">
          {inner}
        </code>
      );
    }
    // Remove any leftover stray asterisks so text is 100% clean
    const cleaned = part.replace(/\*\*/g, "");
    return cleaned;
  });
}

function CleanMessageContent({ content }) {
  if (!content) return null;

  // Split by double newline or multiple newlines into paragraphs/sections
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-3 leading-relaxed text-[#ececec]">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split("\n").filter((l) => l.trim().length > 0);

        return (
          <div key={pIdx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              // Numbered list item: e.g. "1. **Check Systems:** ..."
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                const [, num, rest] = numMatch;
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1 py-0.5">
                    <span className="font-semibold text-emerald-400 shrink-0 text-sm select-none">
                      {num}.
                    </span>
                    <div className="flex-1 text-sm sm:text-base leading-relaxed">
                      {renderFormattedInline(rest)}
                    </div>
                  </div>
                );
              }

              // Bullet item: e.g. "- item" or "* item"
              const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
              if (bulletMatch) {
                const [, rest] = bulletMatch;
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1 py-0.5">
                    <span className="text-emerald-400 shrink-0 text-sm mt-0.5 select-none">•</span>
                    <div className="flex-1 text-sm sm:text-base leading-relaxed">
                      {renderFormattedInline(rest)}
                    </div>
                  </div>
                );
              }

              // Standard line or bold heading
              return (
                <p key={lIdx} className="text-sm sm:text-base leading-relaxed">
                  {renderFormattedInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Default Recent Consultations (Persisted in localStorage) ─────────────────
const DEFAULT_RECENTS = [
  {
    id: "r1",
    title: "Merchant Growth Explained",
    query: "Explain our overall merchant growth strategy, recent footfall trends, and top revenue drivers.",
  },
  {
    id: "r2",
    title: "Explain n8n Automation",
    query: "How does n8n execute our automated WhatsApp and SMS campaigns with live webhooks?",
  },
  {
    id: "r3",
    title: "Afternoon Lull Flash Offer",
    query: "Why do sales dip between 2 PM and 5 PM, and what flash campaign should we launch?",
  },
  {
    id: "r4",
    title: "Monsoon Hot Beverage Combos",
    query: "Monsoon rains are boosting hot beverage demand. What snack combo maximizes our margin?",
  },
  {
    id: "r5",
    title: "14-Day Inactive Customer Winback",
    query: "Which regular customers haven't ordered in 14 days? Craft a targeted WhatsApp winback.",
  },
  {
    id: "r6",
    title: "High-Margin Basket Optimization",
    query: "Which products paired with Cappuccino drive the highest average order value?",
  },
  {
    id: "r7",
    title: "Weekend Footfall Surge Readiness",
    query: "How can I prepare for the upcoming weekend footfall surge?",
  },
];

// ─── Suggested Starter Cards ──────────────────────────────────────────────────
const QUICK_PROMPTS = [
  {
    title: "Afternoon Lull Diagnosis",
    desc: "Analyze the 2 PM – 5 PM sales dip and recommend an automated flash offer.",
    query: "Why do sales dip between 2 PM and 5 PM, and what flash campaign should we launch?",
  },
  {
    title: "Monsoon Surge Combos",
    desc: "Craft high-margin hot beverage and pastry pairings for rainy afternoons.",
    query: "Monsoon rains are boosting hot beverage demand. What snack combo maximizes our margin?",
  },
  {
    title: "14-Day Inactive Winback",
    desc: "Identify lapsed customers and generate an approved WhatsApp retention perk.",
    query: "Which regular customers haven't ordered in 14 days? Craft a targeted WhatsApp winback.",
  },
  {
    title: "High-Margin Cross-Sell",
    desc: "Discover top converting food pairings to increase average basket size.",
    query: "Which products paired with Cappuccino drive the highest average order value?",
  },
];

export default function AICopilot() {
  const { merchant } = useMerchantContext();
  const { messages, loading, error, sendMessage, clearHistory } = useCopilot(merchant?._id);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatId, setActiveChatId] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // ─── Voice State & Handlers ────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState(null);
  const [voiceConfirmModal, setVoiceConfirmModal] = useState(null);
  const [voiceApproving, setVoiceApproving] = useState(false);
  const recognitionRef = useRef(null);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Text-to-Speech (TTS)
  const speakText = (text, msgIndex) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMsgIndex === msgIndex) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text for speech synthesis: remove markdown, code, and emojis
    const clean = text
      .replace(/\*\*/g, "")
      .replace(/#+\s/g, "")
      .replace(/`.*?`/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgIndex(null);
    utterance.onerror = () => setSpeakingMsgIndex(null);

    setSpeakingMsgIndex(msgIndex);
    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text (STT)
  const startListening = () => {
    setVoiceError(null);
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = async (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        setInput(transcript);

        const isFinal = event.results[event.results.length - 1].isFinal;
        if (isFinal) {
          setIsListening(false);
          const lower = transcript.toLowerCase().trim();

          // Check if speech matches an approval intent
          const isApprovalIntent =
            lower === "approve" ||
            lower === "approve action" ||
            lower === "approve campaign" ||
            lower === "launch campaign" ||
            lower === "approve and launch" ||
            lower === "confirm approval" ||
            lower === "yes approve";

          if (isApprovalIntent && merchant?._id) {
            try {
              const actionsRes = await fetchMerchantActions(merchant._id);
              const pending = (actionsRes.data || []).find(
                (a) => a.approvalStatus === "PENDING"
              );
              if (pending) {
                setVoiceConfirmModal(pending);
                return;
              }
            } catch (err) {
              console.error("Failed checking pending actions for voice approval:", err);
            }
          }

          // Otherwise, if it's a substantive query, auto-dispatch to copilot
          if (transcript.trim().length > 3) {
            sendMessage(transcript.trim());
            setInput("");
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceError("Microphone permission was denied. Please allow microphone access in your browser.");
        } else if (event.error !== "no-speech") {
          setVoiceError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("SpeechRecognition start failed:", err);
      setIsListening(false);
      setVoiceError("Could not start microphone. Please check permissions.");
    }
  };

  // Voice Action Approval Confirmation
  const handleConfirmVoiceApprove = async () => {
    if (!voiceConfirmModal || !merchant?._id) return;
    setVoiceApproving(true);
    try {
      await approveAction(voiceConfirmModal._id, { merchantId: merchant._id });
      setVoiceSuccessMsg(
        `✓ Campaign "${voiceConfirmModal.title}" approved and dispatched via n8n automation.`
      );
      const approvedTitle = voiceConfirmModal.title;
      setVoiceConfirmModal(null);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(
          `Campaign ${approvedTitle} approved. n8n automation is now executing.`
        );
        window.speechSynthesis.speak(u);
      }
      setTimeout(() => setVoiceSuccessMsg(null), 6000);
    } catch (err) {
      console.error("Voice approval failed:", err);
      setVoiceError(err.message || "Failed to approve action via voice");
    } finally {
      setVoiceApproving(false);
    }
  };

  // Load / persist recents in localStorage
  const [recents, setRecents] = useState(() => {
    try {
      const saved = localStorage.getItem("growkaro_recent_chats");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load recents from localStorage", e);
    }
    return DEFAULT_RECENTS;
  });

  const saveRecents = (updated) => {
    setRecents(updated);
    try {
      localStorage.setItem("growkaro_recent_chats", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save recents to localStorage", e);
    }
  };

  // Delete a recent chat
  const handleDeleteRecent = (e, idToDelete) => {
    e.stopPropagation();
    const updated = recents.filter((item) => item.id !== idToDelete);
    saveRecents(updated);
    if (activeChatId === idToDelete) {
      setActiveChatId(null);
      clearHistory();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const queryText = input.trim();
    sendMessage(queryText);
    setInput("");

    // Add query to recents if not already present
    if (!recents.some((r) => r.title.toLowerCase() === queryText.toLowerCase())) {
      const newRecent = {
        id: "r_" + Date.now(),
        title: queryText.length > 32 ? queryText.slice(0, 32) + "..." : queryText,
        query: queryText,
      };
      const updated = [newRecent, ...recents.slice(0, 14)];
      saveRecents(updated);
      setActiveChatId(newRecent.id);
    }
  };

  const handleSelectRecent = (item) => {
    setActiveChatId(item.id);
    if (loading) return;
    sendMessage(item.query);
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    clearHistory();
  };

  const filteredRecents = recents.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const merchantName = merchant?.businessName || "Cafe Aroma";
  const { label: typeLabel, logo: merchantLogo } = getBusinessTypeInfo(merchant?.businessType, merchantName);

  // Initials for avatar
  const initials = merchantName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#212121] text-[#ececec] overflow-hidden font-sans select-text">
      {/* ─── LEFT SIDEBAR (GROWKARO AI MINIMALIST TEMPLATE) ───────────────────── */}
      <aside
        className={`transition-all duration-300 ease-in-out flex flex-col bg-[#171717] shrink-0 z-20 ${
          sidebarOpen ? "w-64 sm:w-72 border-r border-[#262626]" : "w-0 overflow-hidden border-none opacity-0 pointer-events-none"
        }`}
      >
        {/* Sidebar Header: GrowKaro AI Title + Search Icon + Sidebar Toggle Icon */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tracking-tight">GrowKaro AI</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded">
              Copilot
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Search chats toggle icon */}
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#212121] transition-colors ${
                searchOpen ? "bg-[#212121] text-white" : ""
              }`}
              title="Search consultations"
              aria-label="Search consultations"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Sidebar close toggle button [ | ] */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#212121] transition-colors"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="16" rx="3" strokeWidth="1.8" />
                <line x1="9" y1="4" x2="9" y2="20" strokeWidth="1.8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Optional quick search field */}
        {searchOpen && (
          <div className="px-3 pb-2 pt-0 animate-fade-in">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search consultations..."
              autoFocus
              className="w-full bg-[#212121] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
          </div>
        )}

        {/* Top Navigation Items */}
        <div className="px-2 pt-1 pb-2 space-y-0.5">
          {/* New consultation */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#ececec] hover:bg-[#212121] transition-colors font-normal text-left group"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="truncate">New consultation</span>
          </button>

          {/* Library (Insights) */}
          <button
            onClick={() => navigate("/insights")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors font-normal text-left group"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="truncate">Insights Library</span>
          </button>

          {/* Projects (Campaigns) */}
          <button
            onClick={() => navigate("/campaigns")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors font-normal text-left group"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="truncate">Campaigns &amp; Actions</span>
          </button>

          {/* Scheduled (Activity) */}
          <button
            onClick={() => navigate("/activity")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors font-normal text-left group"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">Scheduled Activity</span>
          </button>

          {/* Plugins (Automations & n8n) */}
          <button
            onClick={() => navigate("/demo-control")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors font-normal text-left group"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="truncate">Automations (n8n)</span>
          </button>

          {/* More Flyout */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen((prev) => !prev)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors font-normal text-left group"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
              <span className="truncate">More</span>
            </button>

            {moreMenuOpen && (
              <div className="absolute left-2 right-2 mt-1 py-1.5 bg-[#212121] border border-[#333] rounded-xl shadow-2xl z-30 space-y-1">
                <button
                  onClick={() => { navigate("/analytics"); setMoreMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#2f2f2f] transition-colors"
                >
                  📊 Business Analytics
                </button>
                <button
                  onClick={() => { navigate("/products"); setMoreMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#2f2f2f] transition-colors"
                >
                  📦 Products &amp; Inventory
                </button>
                <button
                  onClick={() => { navigate("/customers"); setMoreMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#2f2f2f] transition-colors"
                >
                  👥 Customer Clusters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── RECENTS SECTION (DELETABLE WITH TRASH ICON) ───────────────────── */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 select-none">
          <div className="px-3 pt-3 pb-1 text-xs font-semibold text-[#8e8e8e]">
            Recents
          </div>

          {filteredRecents.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-500 text-center">
              No recent consultations
            </div>
          ) : (
            filteredRecents.map((item) => {
              const isActive = activeChatId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectRecent(item)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                    isActive
                      ? "bg-[#212121] text-white font-medium"
                      : "text-[#ececec] hover:bg-[#212121]"
                  }`}
                  title={item.title}
                >
                  <span className="truncate pr-5 flex-1">{item.title}</span>

                  {/* Delete Button: Trash icon on hover */}
                  <button
                    onClick={(e) => handleDeleteRecent(e, item.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-gray-400 p-1 rounded transition-opacity shrink-0 ml-1"
                    title="Delete consultation"
                    aria-label={`Delete ${item.title}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* ─── BOTTOM PROFILE (MERCHANT BRANDED) ─────────────────────────────── */}
        <div className="p-2 border-t border-[#262626] bg-[#171717]">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#212121] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Crisp Merchant Brand Logo */}
              <div className="w-8 h-8 rounded-full bg-white border border-[#333] p-0.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                <img
                  src={merchantLogo}
                  alt={merchantName}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="truncate">
                <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                  {merchantName}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {typeLabel || "Merchant Partner"}
                </p>
              </div>
            </div>

            {/* Storefront awning outline icon */}
            <div className="text-gray-400 group-hover:text-white transition-colors p-1" title="Merchant Store">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M3 3h18v4l-2 3v10a1 1 0 01-1 1H6a1 1 0 01-1-1V10L3 7V3z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M3 7l2 3h14l2-3"
                />
              </svg>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN GROWKARO AI CANVAS ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#212121] relative overflow-hidden">
        {/* Top Minimalist Header */}
        <header className="h-14 px-4 flex items-center justify-between border-b border-[#2a2a2a] bg-[#212121]/90 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2f2f2f] transition-colors focus:outline-none"
                title="Open sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="16" rx="3" strokeWidth="1.8" />
                  <line x1="9" y1="4" x2="9" y2="20" strokeWidth="1.8" />
                </svg>
              </button>
            )}

            {/* Model Selector Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold text-[#ececec] hover:bg-[#2f2f2f] cursor-pointer transition-colors">
              <span>GrowKaro AI</span>
              <span className="text-xs text-emerald-400 font-normal">Qwen 2.5 (Fast)</span>
              <svg className="w-3.5 h-3.5 text-gray-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-md hover:bg-[#2f2f2f] transition-colors"
                title="Clear current consultation"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* ─── CHAT CONTENT STREAM ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            {/* Empty State: GrowKaro Business Welcome */}
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center my-auto py-8 animate-fade-in">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-2">
                  Where should we grow today, {merchantName}?
                </h1>
                <p className="text-sm text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                  Real-time telemetry advisory, lull-hour campaigns, and product basket optimization.
                </p>

                {/* 4 Minimalist Prompt Starter Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-8">
                  {QUICK_PROMPTS.map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(card.query)}
                      disabled={loading}
                      className="text-left p-3.5 rounded-2xl bg-[#2f2f2f] hover:bg-[#383838] border border-[#3e3e3e] hover:border-[#525252] transition-all group flex flex-col justify-between"
                    >
                      <h4 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors mb-1">
                        {card.title}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {card.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Chat Stream */
              <div className="space-y-6 pb-28 pt-2">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={index}
                      className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-[#10a37f] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm mt-0.5">
                          ✦
                        </div>
                      )}

                      <div
                        className={`max-w-2xl rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed ${
                          isUser
                            ? "bg-[#2f2f2f] text-white rounded-tr-sm border border-[#383838]"
                            : "bg-[#262626] border border-[#333] text-[#ececec] rounded-tl-sm space-y-3 shadow-md"
                        }`}
                      >
                        {/* Message content (Clean, Asterisk-Free Formatter) */}
                        <CleanMessageContent content={msg.content} />

                        {/* Grounded Evidence Facts (Assistant only) */}
                        {!isUser && msg.facts && msg.facts.length > 0 && (
                          <div className="bg-[#1e1e1e] border border-[#333] rounded-xl p-3 space-y-1 mt-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                              <span>📊 Grounded Business Telemetry &amp; Facts</span>
                            </div>
                            <ul className="list-disc pl-4 text-xs sm:text-sm text-gray-300 space-y-1">
                              {msg.facts.map((fact, idx) => (
                                <li key={idx} className="leading-snug">
                                  {renderFormattedInline(fact)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommended Next Action Card (Assistant only) */}
                        {!isUser && msg.recommendation?.action && (
                          <div className="bg-gradient-to-r from-[#1c242e] to-[#1a2b27] border border-emerald-500/30 rounded-xl p-3.5 space-y-2 mt-2 shadow">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                💡 Recommended Agentic Action
                              </span>
                              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                Ready to Launch
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-white">
                              {renderFormattedInline(msg.recommendation.action)}
                            </p>

                            {msg.recommendation.goal && (
                              <p className="text-xs text-gray-300">
                                <span className="font-semibold text-emerald-300">Goal:</span>{" "}
                                {renderFormattedInline(msg.recommendation.goal)}
                              </p>
                            )}

                            <div className="pt-2 flex items-center justify-end">
                              <button
                                onClick={() => navigate("/campaigns")}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                              >
                                <span>Review &amp; Execute in Campaigns</span>
                                <span>→</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Provenance footer */}
                        {!isUser && !msg.isError && (
                          <div className="pt-1.5 flex flex-wrap items-center justify-between text-[11px] text-gray-400 border-t border-[#2e2e2e] gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">
                                {msg.isGenerative ? "✨ Groq Qwen 2.5" : "⚡ Grounded Rule Reasoning"}
                              </span>
                              <span>•</span>
                              <span>MongoDB &amp; Cognee Memory</span>
                            </div>

                            {/* Voice TTS Speaker Button */}
                            <button
                              type="button"
                              onClick={() => speakText(msg.content, index)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                                speakingMsgIndex === index
                                  ? "text-emerald-400 bg-emerald-500/20 font-semibold"
                                  : "text-gray-400 hover:text-white hover:bg-[#333]"
                              }`}
                              title={speakingMsgIndex === index ? "Stop speaking" : "Listen to answer (TTS)"}
                            >
                              {speakingMsgIndex === index ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                  <span>Speaking... ⏹️</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                  </svg>
                                  <span>Listen</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex gap-3.5 justify-start animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-[#10a37f] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      ✦
                    </div>
                    <div className="bg-[#262626] border border-[#333] rounded-2xl rounded-tl-sm p-3.5 text-sm flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                      <span className="text-xs text-gray-300">
                        Analyzing store transactions, merchant memory &amp; ambient signals...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* ─── FLOATING CAPSULE INPUT ─────────────────────────────────────────── */}
        <div className="w-full bg-gradient-to-t from-[#212121] via-[#212121]/95 to-transparent pt-3 pb-4 px-4 sm:px-6 shrink-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            {/* Voice Status Banners */}
            {voiceError && (
              <div className="mb-2.5 px-3.5 py-2 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center justify-between animate-fade-in shadow-lg">
                <span className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{voiceError}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVoiceError(null)}
                  className="text-gray-400 hover:text-white font-bold ml-2 px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {voiceSuccessMsg && (
              <div className="mb-2.5 px-3.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-fade-in shadow-lg">
                <span className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>{voiceSuccessMsg}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVoiceSuccessMsg(null)}
                  className="text-gray-400 hover:text-white font-bold ml-2 px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {isListening && (
              <div className="mb-2.5 px-3.5 py-2 rounded-xl bg-red-900/40 border border-red-500/50 text-red-100 text-xs flex items-center justify-between animate-pulse shadow-lg">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="font-medium">
                    Listening for voice command... (e.g. &quot;Why are sales down?&quot; or &quot;Approve&quot;)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={startListening}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-0.5 rounded-lg font-semibold transition-colors"
                >
                  Stop
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-[#2f2f2f] rounded-3xl border border-[#383838] p-2 pl-4 sm:pl-5 shadow-2xl focus-within:border-[#525252] transition-all">
              {/* Plus icon */}
              <button
                type="button"
                className="text-gray-400 hover:text-white p-1 rounded-full transition-colors"
                title="Add tools or context"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListening
                    ? "Listening... speak now"
                    : `Ask GrowKaro AI anything about ${merchantName}...`
                }
                disabled={loading}
                className="flex-1 bg-transparent text-sm sm:text-base text-[#ececec] placeholder-gray-500 focus:outline-none disabled:opacity-50"
              />

              <div className="flex items-center gap-1.5 pr-1">
                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={startListening}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    isListening
                      ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                      : "text-gray-400 hover:text-white hover:bg-[#3e3e3e]"
                  }`}
                  title={
                    isListening
                      ? "Listening... (Click to stop)"
                      : "Voice input (Speak query or 'Approve')"
                  }
                  aria-label="Microphone"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>

                {/* Send button circular up-arrow */}
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-full bg-white text-black hover:bg-gray-200 flex items-center justify-center transition-all disabled:bg-[#424242] disabled:text-[#737373] shadow-sm shrink-0 font-bold"
                  title="Send query"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-500 mt-2">
              GrowKaro AI grounds responses in live store telemetry and ambient signals. Always review actions prior to dispatch.
            </p>
          </form>
        </div>

        {/* ─── VOICE ACTION APPROVAL CONFIRMATION MODAL ───────────────────────── */}
        {voiceConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1f1f1f] border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#333] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold border border-emerald-500/30">
                    🎙️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Voice Action Approval Confirmation</h3>
                    <p className="text-xs text-emerald-400 font-medium">Merchant Approval Safety Gate Enforced</p>
                  </div>
                </div>
                <button
                  onClick={() => setVoiceConfirmModal(null)}
                  className="text-gray-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-[#282828] border border-[#3a3a3a] rounded-xl p-4 space-y-2 text-sm text-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Detected Voice Intent:</span>
                  <span className="font-semibold text-emerald-400 uppercase tracking-wider">
                    ✓ Approve &amp; Launch
                  </span>
                </div>
                <div className="font-bold text-base text-white pt-1">
                  {voiceConfirmModal.title}
                </div>
                <div className="text-xs text-gray-400">
                  Channel:{" "}
                  <span className="text-gray-200 font-semibold">
                    {voiceConfirmModal.channel || "WHATSAPP"}
                  </span>{" "}
                  • Audience:{" "}
                  <span className="text-gray-200">
                    {voiceConfirmModal.targetAudience || "All Customers"}
                  </span>
                </div>
                {voiceConfirmModal.payload?.offer && (
                  <div className="text-xs bg-[#1a1a1a] p-2.5 rounded-lg border border-[#333] text-amber-300">
                    <span className="font-bold">Offer:</span> {voiceConfirmModal.payload.offer}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                GrowKaro Safety Protocol: Voice approval commands require explicit merchant confirmation before external automation begins.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVoiceConfirmModal(null)}
                  disabled={voiceApproving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-[#2e2e2e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVoiceApprove}
                  disabled={voiceApproving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center gap-2"
                >
                  {voiceApproving ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Executing via n8n...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm &amp; Launch Automation ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}