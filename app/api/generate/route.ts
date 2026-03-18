import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: Request) {
  const { productName, audience, tone } = await request.json();

  if (!productName || !audience || !tone) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = `You are an elite Shopify copywriter who writes high-converting product pages.

Product: ${productName}
Audience: ${audience}
Tone: ${tone}

IMPORTANT:
- Return ONLY raw JSON
- Do NOT include backticks
- Do NOT include markdown
- Do NOT include "json" labels
- Output must start with { and end with }

Format:
{
  "seoTitle": "",
  "description": "",
  "bulletPoints": [],
  "keywords": [],
  "hooks": []
}

Rules:
- Focus on benefits and emotional impact
- Make it persuasive and high-converting
- Avoid generic phrases
- Hooks should be short, attention-grabbing, and designed for ads or TikTok
- Each hook should make the viewer curious or excited`;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(`__ERROR__:${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
