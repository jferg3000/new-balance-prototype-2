import {
  useCallback,
  type AnimationEvent,
  type CSSProperties,
  type ReactNode,
} from "react";

type MaskedLineProps = {
  children: ReactNode;
  delayMs: number;
  durationMs: number;
  className?: string;
  /**
   * When true, play the reveal. When false, hold the masked initial state.
   * Defaults to true so mount-triggered heroes can opt in immediately.
   */
  active?: boolean;
};

/**
 * Overflow-mask typography entrance — translateY 115%→0, opacity 0.85→1.
 * Shared with the approved title/subtitle masked line reveal.
 */
export function MaskedLine({
  children,
  delayMs,
  durationMs,
  className,
  active = true,
}: MaskedLineProps) {
  const handleAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLSpanElement>) => {
      if (event.target !== event.currentTarget) return;
      event.currentTarget.style.willChange = "auto";
    },
    [],
  );

  return (
    <span className={["masked-line", className].filter(Boolean).join(" ")}>
      <span
        className={[
          "masked-line__text",
          active ? "masked-line__text--play" : null,
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          {
            "--reveal-delay": `${delayMs}ms`,
            "--reveal-duration": `${durationMs}ms`,
            willChange: active ? "transform, opacity" : undefined,
          } as CSSProperties
        }
        onAnimationEnd={handleAnimationEnd}
      >
        {children}
      </span>
    </span>
  );
}
