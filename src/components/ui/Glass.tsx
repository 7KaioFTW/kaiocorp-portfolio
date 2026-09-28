import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** "over3d" = homepage sections floating over the 3D world (spec §3.3). */
export type SectionVariant = "default" | "over3d";

interface GlassProps {
  on: boolean;
  className?: string;
  children: ReactNode;
}

// Dark glass panel carrying a section's content over the 3D world. With on={false} it renders the
// children unchanged, so the default variant keeps today's markup.
export function Glass({ on, className, children }: GlassProps) {
  if (!on) return <>{children}</>;
  return <div className={cn("island-glass", className)}>{children}</div>;
}
