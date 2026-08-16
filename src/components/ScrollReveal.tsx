import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { usePdpRevealOnce } from "../hooks/usePdpMotion";

type ScrollRevealProps = {
  as?: "section" | "div" | "aside";
  className?: string;
  children: ReactNode;
  /**
   * When true, skip the entrance if the element is already past the reveal
   * line (used for lazy-batch remounts after skeleton→card settle).
   */
  instantIfVisible?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object") {
    (ref as { current: T | null }).current = value;
  }
}

/**
 * Shared PDP / PLP / Stone Island scroll reveal — same motion as approved PDP.
 */
export const ScrollReveal = forwardRef<HTMLElement, ScrollRevealProps>(
  function ScrollReveal(
    {
      as: Tag = "section",
      className = "",
      children,
      instantIfVisible = false,
      ...rest
    },
    forwardedRef,
  ) {
    const revealRef = usePdpRevealOnce<HTMLElement>({ instantIfVisible });
    const classes = ["pdp-reveal-section", className].filter(Boolean).join(" ");

    // Callback ref avoids RefObject<HTMLElement> vs HTMLDivElement/HTMLElement
    // mismatch when `Tag` is a union of intrinsic elements.
    const setRefs = (node: HTMLElement | null) => {
      (revealRef as { current: HTMLElement | null }).current = node;
      assignRef(forwardedRef, node);
    };

    return (
      <Tag ref={setRefs} className={classes} {...rest}>
        {children}
      </Tag>
    );
  },
);
