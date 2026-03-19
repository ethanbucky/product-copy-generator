"use client";

import { useState, useRef } from "react";

interface GeneratedCopy {
  seoTitle: string;
  description: string;
  bulletPoints: string[];
  keywords: string[];
  hooks: string[];
}

const TONES = [
  "Professional",
  "Friendly & Casual",
  "Luxury & Premium",
  "Bold & Energetic",
  "Minimalist & Clean",
  "Playful & Fun",
  "Technical & Precise",
  "Empathetic & Caring",
];

export default function Home() {
  const [productName, setProductName] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const FREE_LIMIT = 3;
  const [streamBuffer, setStreamBuffer] = useState("");
  const [result, setResult] = useState<GeneratedCopy | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const bufferRef = useRef("");

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (usageCount >= FREE_LIMIT) {
    setError("Free limit reached. Upgrade to continue.");
    return;
  }

  setLoading(true);
  setError("");
  setResult(null);
  setStreamBuffer("");
  bufferRef.current = "";

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, audience, tone }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        if (chunk.startsWith("__ERROR__:")) {
          throw new Error(chunk.replace("__ERROR__:", ""));
        }

        bufferRef.current += chunk;
        setStreamBuffer(bufferRef.current);
      }

      // Parse the final JSON
      const jsonStr = bufferRef.current.trim();
      const parsed: GeneratedCopy = JSON.parse(jsonStr);
      setResult({
  seoTitle: parsed.seoTitle || "",
  description: parsed.description || "",
  bulletPoints: parsed.bulletPoints || [],
  keywords: parsed.keywords || [],
  hooks: parsed.hooks || [],
});

setUsageCount((prev) => prev + 1);
      setStreamBuffer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function copyAll() {
  if (!result) return;
  const text = [
    `SEO TITLE\n${result.seoTitle}`,
    `\nDESCRIPTION\n${result.description}`,
    `\nBULLET POINTS\n${result.bulletPoints.map((b) => `• ${b}`).join("\n")}`,
    `\nKEYWORDS\n${result.keywords.join(", ")}`,
    `\nAD HOOKS\n${result.hooks.map((h) => `• ${h}`).join("\n")}`,
  ].join("\n");
  copyToClipboard(text, "all");
}

 async function handleUpgrade() {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to start checkout");
    }

    window.location.href = data.url;
  } catch (err) {
    setError(err instanceof Error ? err.message : "Upgrade failed");
  }
}
const isStreaming = loading && streamBuffer.length > 0;

  return (
    <main className="app">
      <header className="header">
        <div className="header-badge">✦ AI-Powered</div>
        <h1>Product Copy Generator</h1>
        <p>Generate SEO titles, descriptions, bullet points, and keywords in seconds</p>
      </header>

      {/* Form */}
      <div className="card">
        <p className="card-title">Product Details</p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="productName">Product Name</label>
              <input
                id="productName"
                type="text"
                placeholder="e.g. AquaFlow Water Bottle"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="tone">Tone</label>
              <select
                id="tone"

                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group full">
              <label htmlFor="audience">Target Audience</label>
              <input
                id="audience"
                type="text"
                placeholder="e.g. Health-conscious professionals aged 25-40"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                required
              />
            </div>
          </div>

<p style={{ fontSize: 12, color: "var(--text-muted)" }}>
  Free uses left: {FREE_LIMIT - usageCount}
</p>

<button type="submit" className="btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Generating...
              </>
            ) : (
              "Generate Copy"
            )}
          </button>
{error && (
  <div className="error-box">
    <div>{error}</div>
    {usageCount >= FREE_LIMIT && (
      <div style={{ marginTop: 10 }}>
        <button type="button" className="btn" onClick={handleUpgrade}>
          Upgrade
        </button>
      </div>
    )}
  </div>
)}        </form>
      </div>

      {/* Streaming preview */}
      {isStreaming && (
        <div className="card">
          <p className="card-title">Generating</p>
          <div className="output-text" style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {streamBuffer}
            <span className="cursor" />
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="output-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <p className="card-title" style={{ marginBottom: 0 }}>Generated Copy</p>
            <button className="copy-btn" onClick={copyAll} style={{ fontSize: 13, padding: "6px 14px" }}>
              {copied === "all" ? "✓ Copied All" : "Copy All"}
            </button>
          </div>

          {/* SEO Title */}
          <div className="output-card">
            <div className="output-card-header">
              <span className="output-label">
                <span className="dot" />
                SEO Title
              </span>
              <button
                className={`copy-btn ${copied === "title" ? "copied" : ""}`}
                onClick={() => copyToClipboard(result.seoTitle, "title")}
              >
                {copied === "title" ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div className="output-body">
              <p className="output-text title">{result.seoTitle}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                {result.seoTitle.length} characters
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="output-card">
            <div className="output-card-header">
              <span className="output-label">
                <span className="dot" />
                Product Description
              </span>
              <button
                className={`copy-btn ${copied === "desc" ? "copied" : ""}`}
                onClick={() => copyToClipboard(result.description, "desc")}
              >
                {copied === "desc" ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div className="output-body">
              <p className="output-text">{result.description}</p>
            </div>
          </div>

          {/* Bullet Points */}
          <div className="output-card">
            <div className="output-card-header">
              <span className="output-label">
                <span className="dot" />
                Key Benefits
              </span>
              <button
                className={`copy-btn ${copied === "bullets" ? "copied" : ""}`}
                onClick={() =>
                  copyToClipboard(
                    result.bulletPoints.map((b) => `• ${b}`).join("\n"),
                    "bullets"
                  )
                }
              >
                {copied === "bullets" ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div className="output-body">
              <ul className="bullet-list">
                {result.bulletPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Keywords */}
          <div className="output-card">
            <div className="output-card-header">
              <span className="output-label">
                <span className="dot" />
                Keywords
              </span>
              <button
                className={`copy-btn ${copied === "keywords" ? "copied" : ""}`}
                onClick={() =>
                  copyToClipboard(result.keywords.join(", "), "keywords")
                }
              >
                {copied === "keywords" ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div className="output-body">
              <div className="keyword-list">
                {result.keywords.map((kw, i) => (
                  <span key={i} className="keyword-tag">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
                    </div>

          {/* Ad Hooks */}
          <div className="output-card">
            <div className="output-card-header">
              <span className="output-label">
                <span className="dot" />
                Ad Hooks
              </span>
              <button
                className={`copy-btn ${copied === "hooks" ? "copied" : ""}`}
                onClick={() =>
                  copyToClipboard(
                    result.hooks.map((hook) => `• ${hook}`).join("\n"),
                    "hooks"
                  )
                }
              >
                {copied === "hooks" ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div className="output-body">
              <ul className="bullet-list">
                {result.hooks.map((hook, i) => (
                  <li key={i}>{hook}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <p>Fill in the form above and click Generate to create your product copy</p>
        </div>
      )}
    </main>
  );
}
