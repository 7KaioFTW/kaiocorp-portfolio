"use client";

import Link from "next/link";

function processInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))|(`(.+?)`)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) parts.push(<strong key={key++} className="font-semibold text-slate-300">{match[2]}</strong>);
    else if (match[3]) {
      const href = match[5];
      if (href.startsWith("/")) parts.push(<Link key={key++} href={href} className="text-accent hover:text-accent-light underline underline-offset-2">{match[4]}</Link>);
      else parts.push(<a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light underline underline-offset-2">{match[4]}</a>);
    }
    else if (match[6]) parts.push(<code key={key++} className="rounded bg-surface-light px-1.5 py-0.5 text-xs text-accent">{match[7]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="mt-10 mb-4 font-heading text-xl font-bold uppercase tracking-wide text-white">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="mt-8 mb-3 font-heading text-base font-bold text-white">{line.slice(4)}</h3>);
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(<pre key={key++} className="mb-4 overflow-x-auto rounded-lg bg-surface-light p-4 text-xs text-slate-300"><code>{codeLines.join("\n")}</code></pre>);
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) { items.push(lines[i].slice(2)); i++; }
      elements.push(<ul key={key++} className="mb-4 list-disc pl-5 text-sm text-slate-400 space-y-1">{items.map((item, j) => <li key={j}>{processInline(item)}</li>)}</ul>);
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, "")); i++; }
      elements.push(<ol key={key++} className="mb-4 list-decimal pl-5 text-sm text-slate-400 space-y-1">{items.map((item, j) => <li key={j}>{processInline(item)}</li>)}</ol>);
      continue;
    } else if (line.startsWith("> ")) {
      elements.push(<blockquote key={key++} className="mb-4 border-l-2 border-primary pl-4 text-sm italic text-slate-400">{processInline(line.slice(2))}</blockquote>);
    } else if (line.trim()) {
      elements.push(<p key={key++} className="mb-4 text-sm leading-relaxed text-slate-400">{processInline(line)}</p>);
    }
    i++;
  }

  return <div>{elements}</div>;
}
