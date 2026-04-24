import ollama from "ollama";

const THINKING_MODELS = ["deepseek-r1", "qwq", "qwen3"];
const VISION_MODELS = ["gemma3", "gemma4", "medgemma", "llava", "llava-phi3", "moondream", "bakllava"];

function isThinkingModel(model) {
  return THINKING_MODELS.some((m) => model.toLowerCase().includes(m));
}

function isVisionModel(model) {
  return VISION_MODELS.some((m) => model.toLowerCase().includes(m));
}

const IMAGE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    objects: { type: "array", items: { type: "string" } },
    colors: { type: "array", items: { type: "string" } },
    scene: { type: "string" },
    text_content: { type: "string" },
  },
  required: ["summary", "objects", "colors", "scene"],
};

export async function POST(req) {
  const { messages, model } = await req.json();
  const encoder = new TextEncoder();

  // Check if latest user message has images
  const lastMsg = messages.at(-1);
  const hasImages = lastMsg?.images?.length > 0;

  // Vision: structured output, no stream
  if (hasImages && isVisionModel(model)) {
    try {
      const res = await ollama.chat({
        model,
        messages,
        format: IMAGE_SCHEMA,
        stream: false,
        options: { temperature: 0 },
      });
      return new Response(
        JSON.stringify({ type: "vision", data: JSON.parse(res.message.content) }),
        { headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Thinking model: no stream
  if (isThinkingModel(model)) {
    try {
      const res = await ollama.chat({ model, messages, think: true, stream: false });
      return new Response(
        JSON.stringify({ type: "thinking", thinking: res.message?.thinking || "", response: res.message?.content || "" }),
        { headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Normal model: stream text
  try {
    const stream = await ollama.chat({ model, messages, stream: true });
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(chunk.message?.content || ""));
        }
        controller.close();
      },
    });
    return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
