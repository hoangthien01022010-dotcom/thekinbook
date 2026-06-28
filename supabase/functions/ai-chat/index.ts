// Lovable AI chat endpoint
// Calls the Lovable AI Gateway and streams a complete response back.
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { prompt, messages, model } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const chatMessages: Array<{ role: string; content: string }> = [];
    if (Array.isArray(messages) && messages.length) {
      for (const m of messages) {
        if (!m || !m.content) continue;
        const role = m.role === "bot" || m.role === "assistant" ? "assistant" : (m.role === "system" ? "system" : "user");
        chatMessages.push({ role, content: String(m.content) });
      }
    }
    if (prompt && typeof prompt === "string") {
      chatMessages.push({ role: "user", content: prompt });
    }
    if (chatMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No prompt" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.5-flash",
        messages: chatMessages,
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited, please try again." }), {
        status: 429,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits depleted. Add credits in workspace settings." }), {
        status: 402,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `Upstream ${res.status}: ${t}` }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ text, response: text }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
