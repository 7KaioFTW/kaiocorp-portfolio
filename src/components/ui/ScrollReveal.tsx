interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
}

// Server-compatible marker: the motion engine (src/lib/motion) animates [data-motion="reveal"]
// once loaded. Without it (reduced motion / JS off) the content is simply visible.
export function ScrollReveal({ children, className }: ScrollRevealProps) {
  return (
    <div data-motion="reveal" className={className}>
      {children}
    </div>
  );
}
