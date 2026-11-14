import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

function renderInline(text: string): React.ReactNode[] {
  // Parse **bold**, `code`, and safe [label](https://...) links without dangerouslySetInnerHTML
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#0F172A] dark:text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-slate-800 text-[#059669] dark:text-emerald-300 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#059669] dark:text-emerald-400 underline underline-offset-2 hover:text-[#047857]"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className = '' }) => {
  const blocks = content.split(/\n{2,}/);

  return (
    <div className={`space-y-2.5 text-sm leading-relaxed text-[#475569] dark:text-slate-300 ${className}`}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.split('\n');
          const codeBody = lines.slice(1, -1).join('\n');
          return (
            <pre
              key={bIdx}
              className="overflow-x-auto rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 p-3.5 text-xs font-mono"
            >
              <code>{codeBody}</code>
            </pre>
          );
        }

        const lines = trimmed.split('\n');
        const isBulletList = lines.every((l) => /^[-*]\s+/.test(l.trim()));
        if (isBulletList) {
          return (
            <ul key={bIdx} className="list-disc pl-5 space-y-1">
              {lines.map((l, i) => (
                <li key={i}>{renderInline(l.trim().replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        const isOrderedList = lines.every((l) => /^\d+\.\s+/.test(l.trim()));
        if (isOrderedList) {
          return (
            <ol key={bIdx} className="list-decimal pl-5 space-y-1">
              {lines.map((l, i) => (
                <li key={i}>{renderInline(l.trim().replace(/^\d+\.\s+/, ''))}</li>
              ))}
            </ol>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={bIdx} className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={bIdx} className="text-base font-semibold text-[#0F172A] dark:text-slate-100">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }

        return (
          <p key={bIdx} className="whitespace-pre-line">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
