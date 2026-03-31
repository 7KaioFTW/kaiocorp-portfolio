import Link from "next/link";

interface Crumb { label: string; href?: string; }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 text-xs text-slate-400">
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span className="mx-2">/</span>}
          {item.href ? <Link href={item.href} className="transition-colors hover:text-accent">{item.label}</Link> : <span className="text-slate-400">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
