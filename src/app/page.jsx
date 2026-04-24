"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Paperclip, ArrowUpIcon, ChevronDown, ChevronUp, Square, X } from "lucide-react";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import ReactMarkdown from "react-markdown";

const THINKING_MODELS = ["deepseek-r1", "qwq", "qwen3"];
const VISION_MODELS = ["gemma3", "gemma4", "medgemma", "llava", "moondream"];

const isThinkingModel = (m) => THINKING_MODELS.some((t) => m.toLowerCase().includes(t));
const isVisionModel = (m) => VISION_MODELS.some((t) => m.toLowerCase().includes(t));

// Only strip junk on final rendered text, never on raw streaming content
function stripJunk(text) {
  return text
      .replace(/&lt;[^&]*&gt;/g, "") // Remove &lt;unused94&gt; etc
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&gt;/g, ">") // Replace &gt; with >
      .replace(/&lt;/g, "<") // Replace &lt; with <
      .trim();
}

function ThinkingBlock({ thinking, streaming }) {
  const [open, setOpen] = useState(false);
  return (
      <div className="mb-2">
        <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded-md border border-gray-700 bg-gray-900"
        >
          {streaming ? (
              <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-yellow-400 animate-pulse" />
            Thinking...
          </span>
          ) : (
              <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-green-500" />
            Thought process
          </span>
          )}
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {open && (
            <div className="mt-1 p-3 rounded-md border border-gray-700 bg-gray-900/50 text-xs text-gray-400 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {thinking}
              {streaming && <span className="animate-pulse">▌</span>}
            </div>
        )}
      </div>
  );
}

function LoadingThinking() {
  return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="flex gap-1">
          <span className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
        Model is thinking...
      </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
      <button
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-xs px-2 py-1 rounded   transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
  );
}

const mdComponents = {
  h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold mt-4 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold mt-3 mb-1">{children}</h3>,
  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="ml-2">{children}</li>,
  blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-500 pl-4 my-3 text-gray-400 italic">{children}</blockquote>
  ),
  hr: () => <hr className="border-gray-700 my-4" />,
  a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">{children}</a>
  ),
  // Tables
  table: ({ children }) => (
      <div className="overflow-x-auto my-3">
        <table className="w-full text-sm border border-gray-700 rounded-lg overflow-hidden">{children}</table>
      </div>
  ),
  thead: ({ children }) => <thead className="">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-700">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2 text-left font-semibold border-b border-gray-700">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2">{children}</td>,
  // Code
  code({ inline, className, children, ...props }) {
    if (inline) return <code className="px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;

    // Extract language and optional filename from className (e.g. "language-js:index.js")
    const raw = className?.replace("language-", "") || "";
    const [lang, filename] = raw.includes(":") ? raw.split(":") : [raw, null];
    const codeText = String(children).replace(/\n$/, "");
    const label = filename || lang || null;

    return (
        <div className="my-3 rounded-lg overflow-hidden border border-gray-700">
          <div className="flex items-center justify-between px-4 py-1.5 bg-gray-800 text-xs text-white">
            <span>{label ?? ""}</span>
            <CopyButton text={codeText} />
          </div>
          <pre className="p-4 overflow-x-auto">
          <code className={className} {...props}>{children}</code>
        </pre>
        </div>
    );
  },
};

function VisionResult({ data }) {
  return (
      <div className="w-full max-w-3xl space-y-3 text-sm">
        <p>{data.summary}</p>
        {data.scene && <p className="text-gray-400 text-xs">Scene: {data.scene}</p>}
        {data.objects?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.objects.map((o, i) => (
                  <span key={i} className="px-2 py-0.5  rounded-full text-xs">{o}</span>
              ))}
            </div>
        )}
        {data.colors?.length > 0 && (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-gray-400">Colors:</span>
              {data.colors.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs">{c}</span>
              ))}
            </div>
        )}
        {data.text_content && <p className="text-xs text-gray-400 italic">Text detected: {data.text_content}</p>}
      </div>
  );
}

function AssistantMessage({ m }) {
  // Thinking models: thinking & content come as separate fields
  // Normal models: only content, no thinking
  if (m.vision) return <VisionResult data={m.vision} />;

  const hasThinking = !!m.thinking;
  const response = stripJunk(m.content || "");

  if (!hasThinking) {
    if (m.streaming) return <LoadingThinking />;
    return (
        <div className="w-full max-w-3xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={mdComponents}>
            {response}
          </ReactMarkdown>
        </div>
    );
  }

  return (
      <div className="w-full max-w-3xl">
        <ThinkingBlock thinking={stripJunk(m.thinking)} streaming={m.streaming} />
        {!m.streaming && response && (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={mdComponents}>
              {response}
            </ReactMarkdown>
        )}
      </div>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState([]);
  const [attachedImage, setAttachedImage] = useState(null); // { base64, preview }

  const chatRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1]; // strip data:image/...;base64,
      setAttachedImage({ base64, preview: reader.result });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch("/api/models");
        if (!res.ok) throw new Error("Failed to fetch models");
        const data = await res.json();
        setModels(data || []);
        if (data?.length > 0) setSelectedModel(data[0].name);
      } catch (err) {
        console.error("Models error:", err);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const stopGeneration = () => {
    abortRef.current?.abort();
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedImage) || !selectedModel || loading) return;
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage = {
      role: "user",
      content: input,
      ...(attachedImage && { images: [attachedImage.base64], preview: attachedImage.preview }),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setAttachedImage(null);

    setMessages((prev) => [...prev, { role: "assistant", content: "", thinking: "", streaming: true }]);

    // Build messages for API (exclude preview field)
    const apiMessages = newMessages.map(({ preview, ...m }) => m);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({ messages: apiMessages, model: selectedModel }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: data.response || "",
            thinking: data.thinking || "",
            vision: data.type === "vision" ? data.data : null,
            streaming: false,
          };
          return updated;
        });
      } else {
        // Normal model: stream plain text
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fullText, thinking: "", streaming: true };
            return updated;
          });
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Chat error:", err);
    } finally {
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.at(-1)?.role === "assistant") updated[updated.length - 1].streaming = false;
        return updated;
      });
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  }, [input]);

  return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
          <h1 className="font-semibold">Ollama Chat</h1>
          <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="border border-gray-700 bg-transparent p-1 rounded text-sm"
          >
            {models.map((m, i) => (
                <option key={i} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Chat area */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center gap-6">
          {messages.map((m, i) =>
              m.role === "assistant" ? (
                  <AssistantMessage key={i} m={m} />
              ) : (
                  <div key={i} className="w-full max-w-3xl flex justify-end">
                    <div className="flex flex-col items-end gap-1 max-w-[80%]">
                      {m.preview && (
                          <img src={m.preview} alt="attachment" className="max-h-48 rounded-xl object-cover" />
                      )}
                      {m.content && (
                          <Badge variant="outline" className="rounded-lg text-lg p-2 px-4 py-2 whitespace-pre-wrap">
                            {m.content}
                          </Badge>
                      )}
                    </div>
                  </div>
              )
          )}
          <div className="h-32" />
        </div>

        {/* Input */}
        <div className="fixed bottom-0 w-full flex justify-center px-4 pb-6 pointer-events-none">
          <div className="w-full max-w-3xl pointer-events-auto">
            <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm">
              <Button variant="ghost" size="icon">
                <Plus className="size-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="size-5" />
              </Button>
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              {attachedImage && (
                  <div className="relative shrink-0">
                    <img src={attachedImage.preview} alt="preview" className="size-10 rounded-lg object-cover" />
                    <button
                        onClick={() => setAttachedImage(null)}
                        className="absolute -top-1 -right-1 size-4 bg-gray-600 rounded-full flex items-center justify-center"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
              )}
              <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything"
                  className="min-h-10 max-h-40 resize-none border-0 focus-visible:ring-0"
              />
              {loading ? (
                  <Button size="icon" onClick={stopGeneration} className="rounded-full bg-red-600 hover:bg-red-700">
                    <Square className="size-4 fill-current" />
                  </Button>
              ) : (
                  <Button size="icon" onClick={sendMessage} className="rounded-full">
                    <ArrowUpIcon />
                  </Button>
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
  );
}
