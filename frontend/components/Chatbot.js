import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! I can help you with questions about your products, inventory, sales, and trends. What would you like to know?",
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
      const data = await apiPost("/chatbot", {
        question,
        products,
        history: messages.slice(-8).map((message) => ({
          role: message.role === "bot" ? "assistant" : message.role,
          content: message.text,
        })),
      });
      const botMessage = {
        role: "bot",
        text:
          data.answer || "I could not find enough information to answer that.",
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
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber rounded-full flex items-center justify-center shadow-lg hover:bg-amber/80 transition-all z-50"
        title="Open AI Assistant"
      >
        <MessageSquare size={24} className="text-ground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-[600px] bg-ground-secondary border hairline rounded-2xl shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b hairline">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber rounded-xl flex items-center justify-center">
            <Bot size={20} className="text-ground" />
          </div>
          <div>
            <h3 className="portal-heading text-sm">AI Assistant</h3>
            <p className="portal-label text-muted text-xs">
              Powered by Smart Business AI
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-lg hover:bg-ground flex items-center justify-center transition-colors"
        >
          <X size={18} className="text-muted" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "bot" && (
              <div className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-ground" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-xl ${
                msg.role === "user"
                  ? "bg-amber text-ground portal-text"
                  : "bg-ground border hairline portal-text"
              }`}
            >
              {msg.text}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-ground" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-ground" />
            </div>
            <div className="bg-ground border hairline p-3 rounded-xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-amber rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-amber rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-amber rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t hairline">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about products, stock, sales..."
            className="flex-1 bg-ground border hairline rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-amber transition-colors portal-text"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-amber rounded-xl flex items-center justify-center hover:bg-amber/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} className="text-ground" />
          </button>
        </div>
      </div>
    </div>
  );
}
