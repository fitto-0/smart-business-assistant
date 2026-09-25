import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Bonjour ! Je suis votre assistant. Posez-moi une question sur vos produits, votre stock, vos ventes ou vos tendances.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadProducts = async () => {
    try {
      const data = await apiGet("/products");
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const question = input.trim();
    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-6).map((message) => ({
        role: message.role === "bot" ? "assistant" : "user",
        content: message.text,
      }));

      const data = await apiPost("/chatbot", {
        question,
        history,
      });
      const botMessage = {
        role: "bot",
        text:
          data.reply ||
          data.answer ||
          "Je n'ai pas compris. Pouvez-vous reformuler ?",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Sorry, there was an error connecting to the AI service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-2">
        <span className="micro">Assist</span>
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open assistant"
          title="Open assistant"
          className="w-12 h-12 rounded-xs bg-ink text-canvas hover:bg-ember-300 flex items-center justify-center transition-colors"
        >
          <MessageSquare size={18} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 end-6 w-[380px] max-w-[calc(100vw-2rem)] max-h-[600px] bg-surface border border-line rounded-none flex flex-col z-50">
      {/* Header — hairline, square ember marker, status LED */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <span aria-hidden="true" className="w-1.5 h-1.5 shrink-0 bg-ember-500" />
          <div className="min-w-0">
            <p className="micro">Assist · 00</p>
            <h3 className="text-[14px] font-medium text-ink leading-tight mt-0.5">Assistant</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="status text-olive">
            <span aria-hidden="true" className="w-[5px] h-[5px] bg-olive" />
            Online
          </span>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close assistant"
            className="w-8 h-8 rounded-xs flex items-center justify-center text-ink-2 hover:text-ink hover:bg-canvas transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages — hairline ledger rows */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-canvas">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "bot" && (
              <div className="w-6 h-6 rounded-xs bg-ink text-canvas flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={13} />
              </div>
            )}
            <div
              className={`max-w-[82%] px-3 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap rounded-xs border ${
                msg.role === "user"
                  ? "bg-ink text-canvas border-ink"
                  : "bg-surface text-ink-2 border-line border-s-2 border-s-ember-500"
              }`}
            >
              {msg.text}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-xs bg-surface-2 border border-line flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={13} className="text-ink-2" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-xs bg-ink text-canvas flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot size={13} />
            </div>
            <div className="bg-surface border border-line rounded-xs px-4 py-3">
              {/* shimmer hairline replaces bouncing dots */}
              <div className="h-px w-16 bg-ember-500/60 animate-shimmer" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — square hairline field */}
      <div className="px-4 py-3 border-t border-line bg-surface">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about products, stock, sales…"
            className="flex-1 bg-canvas border border-line rounded-xs px-3 py-2 text-[13px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-ember-500/70 transition-colors"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="w-9 h-9 shrink-0 bg-ink text-canvas rounded-xs flex items-center justify-center hover:bg-ember-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
