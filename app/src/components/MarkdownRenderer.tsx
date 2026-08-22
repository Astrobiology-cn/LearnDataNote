import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";

/* R5：正文统一走构建期 import.meta.glob（lib/content.ts 已 eager 打进 bundle），
 * 组件直接收 content 字符串——消除运行时 fetch（旧 url 模式在产物里
 * 还会 404：/src/content/** 不会进 dist） */
interface MarkdownRendererProps {
  content: string;
}

// ── Obsidian Callout types ──
const CALLOUT_TYPES: Record<string, { icon: string; color: string; bg: string }> = {
  note:      { icon: "📝", color: "hsl(var(--accent-secondary))", bg: "hsla(var(--accent-secondary), 0.08)" },
  tip:       { icon: "💡", color: "hsl(var(--primary))", bg: "hsla(var(--primary), 0.08)" },
  important: { icon: "⭐", color: "#A855F7", bg: "rgba(168,85,247,0.08)" },
  warning:   { icon: "⚠️", color: "#FB9100", bg: "rgba(251,145,0,0.08)" },
  caution:   { icon: "🚫", color: "#F77463", bg: "rgba(247,116,99,0.08)" },
  danger:    { icon: "🔥", color: "#F77463", bg: "rgba(247,116,99,0.08)" },
  info:      { icon: "ℹ️",  color: "hsl(var(--accent-secondary))", bg: "hsla(var(--accent-secondary), 0.08)" },
  success:   { icon: "✅", color: "hsl(var(--primary))", bg: "hsla(var(--primary), 0.08)" },
  question:  { icon: "❓", color: "#FB9100", bg: "rgba(251,145,0,0.08)" },
  quote:     { icon: "💬", color: "hsl(var(--muted-foreground))", bg: "hsla(var(--muted-foreground), 0.08)" },
  example:   { icon: "📋", color: "#6366F1", bg: "rgba(99,102,241,0.08)" },
};

// ── Callout component ──
function Callout({ type, title, body }: { type: string; title: string; body: string }) {
  const style = CALLOUT_TYPES[type] || CALLOUT_TYPES.note;
  return (
    <div
      className="rounded-xl my-5 overflow-hidden"
      style={{ backgroundColor: style.bg, borderLeft: `4px solid ${style.color}` }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm" style={{ color: style.color }}>
        <span>{style.icon}</span>
        <span>{title}</span>
      </div>
      <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
        <MiniMarkdown content={body} />
      </div>
    </div>
  );
}

// ── Mini Markdown renderer for inside Callouts ──
function MiniMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        code: ({ children }) => (
          <code className="bg-muted text-primary px-1 py-0.5 rounded text-sm font-mono">{children}</code>
        ),
        ul: ({ children }) => <ul className="list-disc pl-4 m-0 space-y-0.5">{children}</ul>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Preprocess Obsidian Callouts into raw HTML placeholders ──
function preprocessCallouts(content: string): string {
  return content.replace(
    /^>(\s*)\[!\s*(\w+)\s*\]\s*(.*)\n((?:>(?:\s?).*\n?)*)/gm,
    (_full, _space, type, title, bodyBlock) => {
      const calloutType = type.toLowerCase();
      const calloutTitle = title.trim() || type;
      const body = bodyBlock
        .split("\n")
        .map((line: string) => line.replace(/^>\s?/, ""))
        .filter((line: string) => line.length > 0)
        .join("\n");

      return `<div data-callout="${calloutType}" data-title="${escapeHtml(calloutTitle)}">\n${body}\n</div>\n\n`;
    }
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Main component ──
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const processedContent = useMemo(() => {
    if (!content) return "";
    // Strip YAML frontmatter (--- ... ---) so it never renders as body text
    const stripped = content.replace(/^\s*---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
    return preprocessCallouts(stripped);
  }, [content]);

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          // ── Custom div: handle Callout ──
          div: ({ node, className, children, ...props }) => {
            const calloutType = (props as any)["data-callout"];
            const calloutTitle = (props as any)["data-title"];
            if (calloutType) {
              return (
                <Callout
                  type={calloutType}
                  title={calloutTitle || calloutType}
                  body={String(children || "")}
                />
              );
            }
            return <div className={className}>{children}</div>;
          },

          // ── Headings ──
          h1: ({ children }) => (
            <h1 className="text-3xl font-heading font-semibold text-foreground mt-8 mb-4 pb-3 border-b border-border/40">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const text = String(children || "");
            const m = text.match(/^(\d+)\.\s*(.+)/);
            if (m) {
              return (
                <h2 className="text-xl font-heading font-semibold text-foreground mt-8 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                    {m[1]}
                  </span>
                  <span>{m[2]}</span>
                </h2>
              );
            }
            return <h2 className="text-xl font-heading font-semibold text-foreground mt-8 mb-3">{children}</h2>;
          },
          h3: ({ children }) => <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">{children}</h3>,

          // ── Paragraphs ──
          p: ({ children }) => <p className="text-secondary-foreground leading-relaxed mb-4">{children}</p>,

          // ── Lists ──
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1 text-secondary-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-secondary-foreground">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,

          // ── Code ──
          code: ({ children, className }) => {
            if (!className) {
              return <code className="bg-muted text-primary px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
            }
            return (
              <pre className="bg-card text-foreground p-4 rounded-xl overflow-x-auto text-sm leading-relaxed mb-4 border border-border/60">
                <code className={className}>{children}</code>
              </pre>
            );
          },

          // ── Links ──
          a: ({ href, children }) => (
            <a href={href} className="text-[hsl(var(--accent-secondary))] hover:underline transition-colors">
              {children}
            </a>
          ),

          // ── Tables ──
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-border/60 rounded-lg">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border/60 px-3 py-2 bg-card text-left text-sm font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border border-border/60 px-3 py-2 text-sm text-secondary-foreground">{children}</td>,

          // ── Horizontal rule ──
          hr: () => <hr className="my-6 border-border/40" />,

          // ── Blockquote ──
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-4 my-4 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
