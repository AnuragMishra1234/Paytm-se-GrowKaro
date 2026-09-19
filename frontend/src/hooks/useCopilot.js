import { useState, useCallback } from "react";
import { chatCopilot } from "../services/api";

export function useCopilot(merchantId) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your GrowKaro AI Business Copilot. I analyze your transactions, peak hours, customer segments, and local context to help you grow. What would you like to explore today?",
      facts: [],
      reasoning: null,
      recommendation: null,
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (text) => {
      if (!text || !text.trim() || !merchantId) return;

      const userMsg = {
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      try {
        const historyPayload = messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await chatCopilot({
          merchantId,
          message: text.trim(),
          conversationHistory: historyPayload,
        });

        const data = res.data || {};
        const assistantMsg = {
          role: "assistant",
          content: data.answer || "I reviewed your data but could not generate a response.",
          facts: data.facts || [],
          reasoning: data.reasoning || null,
          recommendation: data.recommendation || null,
          confidence: data.confidence || "MEDIUM",
          isGenerative: data.isGenerative || false,
          contextSnapshot: data.contextSnapshot || null,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errMsg = err.message || "Unable to reach AI copilot. Please check connection.";
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ ${errMsg}`,
            isError: true,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [merchantId, messages]
  );

  const clearHistory = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. Ask me any business question or select a prompt below.",
        facts: [],
        timestamp: new Date(),
      },
    ]);
  };

  return { messages, loading, error, sendMessage, clearHistory };
}