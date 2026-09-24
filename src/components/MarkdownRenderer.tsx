import React from 'react';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parse code blocks vs regular text
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-neutral-200">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLanguage = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const language = hasLanguage ? firstLine : '';
          const code = hasLanguage ? lines.slice(1).join('\n') : lines.join('\n');

          return <CodeBlock key={index} language={language} code={code} />;
        }

        return <FormattedParagraph key={index} text={part} />;
      })}
    </div>
  );
};

const FormattedParagraph: React.FC<{ text: string }> = ({ text }) => {
  const blocks = text.split('\n\n').filter((b) => b.trim().length > 0);

  return (
    <>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        // Headings
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-sm font-semibold text-neutral-100 mt-3 mb-1">
              {formatInline(trimmed.replace('#### ', ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-semibold text-neutral-100 mt-4 mb-1.5">
              {formatInline(trimmed.replace('### ', ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-semibold text-white mt-4 mb-2">
              {formatInline(trimmed.replace('## ', ''))}
            </h2>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          const quoteLines = trimmed
            .split('\n')
            .map((l) => l.replace(/^>\s?/, ''))
            .join(' ');
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-cyan-500/60 pl-3 py-1 my-2 text-neutral-300 italic text-[13px] bg-cyan-950/20 rounded-r-md"
            >
              {formatInline(quoteLines)}
            </blockquote>
          );
        }

        // Unordered List
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
          return (
            <ul key={idx} className="list-disc list-inside space-y-1 my-2 pl-1 text-neutral-300">
              {items.map((item, itemIdx) => {
                const cleaned = item.replace(/^[-*]\s/, '');
                return <li key={itemIdx}>{formatInline(cleaned)}</li>;
              })}
            </ul>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n').filter((l) => /^\d+\.\s/.test(l.trim()));
          return (
            <ol key={idx} className="list-decimal list-inside space-y-1 my-2 pl-1 text-neutral-300">
              {items.map((item, itemIdx) => {
                const cleaned = item.replace(/^\d+\.\s/, '');
                return <li key={itemIdx}>{formatInline(cleaned)}</li>;
              })}
            </ol>
          );
        }

        // Tables
        if (trimmed.includes('|') && trimmed.includes('\n')) {
          const lines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'));
          if (lines.length >= 2) {
            const headerCells = lines[0]
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim());
            const bodyRows = lines.slice(2).map((l) =>
              l
                .split('|')
                .slice(1, -1)
                .map((c) => c.trim())
            );

            return (
              <div key={idx} className="my-3 overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-neutral-300 border-b border-neutral-800">
                    <tr>
                      {headerCells.map((cell, cIdx) => (
                        <th key={cIdx} className="px-3 py-2 font-medium">
                          {formatInline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 bg-neutral-950/40">
                    {bodyRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-neutral-900/30">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-neutral-300">
                            {formatInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Regular paragraph with single line-breaks
        const lines = trimmed.split('\n');
        return (
          <p key={idx} className="text-neutral-200">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {formatInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
};

// Helper function to format bold, italics, inline code
function formatInline(text: string): React.ReactNode {
  // Match `code`, **bold**, *italic*
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, i) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 text-xs font-mono bg-neutral-800/90 text-cyan-300 rounded border border-neutral-700/60"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={i} className="italic text-neutral-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}
