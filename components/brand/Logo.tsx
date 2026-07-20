import { cn } from "@/lib/utils";

interface LogoProps {
  tone?: "dark" | "light";
  withByline?: boolean;
  className?: string;
}

/**
 * Harley Street Aesthetics wordmark — a gold "HSA" monogram beside a stacked
 * serif wordmark. Rendered in the brand serif so it stays crisp on the dark
 * canvas and themeable via the `tone` prop.
 */
export function Logo({ tone = "dark", withByline = false, className }: LogoProps) {
  const word = tone === "light" ? "text-white" : "text-heading";
  const sub = tone === "light" ? "text-white/65" : "text-body/70";
  return (
    <span className={cn("inline-flex items-center gap-3 leading-none", className)}>
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-full border border-peach/45 font-serif text-[13px] font-semibold tracking-[0.08em] text-gold-gradient shadow-[0_0_24px_-8px_rgba(212,175,55,0.6)]"
      >
        HSA
      </span>
      <span className="inline-flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-[15px] uppercase tracking-[0.2em]",
            word,
          )}
        >
          Harley Street
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.42em] text-peach">
          Aesthetics
        </span>
        {withByline && (
          <span
            className={cn(
              "mt-1.5 text-[10px] font-medium uppercase tracking-[0.3em]",
              sub,
            )}
          >
            {"London · Glasgow"}
          </span>
        )}
      </span>
    </span>
  );
}
