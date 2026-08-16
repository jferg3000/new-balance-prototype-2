import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./FullScreenDrawer.css";

type FullScreenDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional id of the element that labelled the dialog (falls back to title text). */
  titleId?: string;
  children: ReactNode;
  /** Element that opened the drawer — focus returns here on close. */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /** Extra class on the dialog panel (e.g. frosted / transparent shells). */
  panelClassName?: string;
  /** Extra class on the dimming backdrop. */
  backdropClassName?: string;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const EXIT_MS = 400;

/**
 * Reusable full-viewport mobile drawer shell.
 * Body scroll is locked while open; focus is trapped inside.
 * Open: bottom → top. Close: top → bottom.
 */
export default function FullScreenDrawer({
  open,
  onClose,
  title,
  titleId: titleIdProp,
  children,
  returnFocusRef,
  panelClassName,
  backdropClassName,
}: FullScreenDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollYRef = useRef(0);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const didLockRef = useRef(false);
  /** True only after the drawer has actually opened — avoids focusing return target on first mount. */
  const hadOpenedRef = useRef(false);
  const autoTitleId = useId();
  const titleId = titleIdProp ?? autoTitleId;
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  const clearBodyLock = useCallback(() => {
    if (!didLockRef.current) return false;
    const { body } = document;
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflow = "";
    didLockRef.current = false;
    return true;
  }, []);

  const lockScroll = useCallback(() => {
    if (didLockRef.current) return;
    scrollYRef.current = window.scrollY;
    const { body } = document;
    body.style.position = "fixed";
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    didLockRef.current = true;
  }, []);

  /** Same-page dismiss — restore the scroll position under the drawer. */
  const unlockScroll = useCallback(() => {
    if (!didLockRef.current) return;
    const y = scrollYRef.current;
    clearBodyLock();
    window.scrollTo(0, y);
  }, [clearBodyLock]);

  // Route changes unmount the drawer while locked — release without restoring
  // the previous page's offset onto the next route (e.g. Quick Shop → PDP).
  useEffect(() => {
    return () => {
      clearBodyLock();
    };
  }, [clearBodyLock]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;

    setClosing(true);
    const id = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_MS);
    return () => window.clearTimeout(id);
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted || closing) return;

    lockScroll();
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    const panel = panelRef.current;

    const focusTimer = window.setTimeout(() => {
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, closing, onClose, lockScroll]);

  useEffect(() => {
    if (mounted) {
      hadOpenedRef.current = true;
      return;
    }
    unlockScroll();
    // Initial mount is mounted=false — do not steal focus onto returnFocusRef.
    if (!hadOpenedRef.current) return;
    hadOpenedRef.current = false;
    const restoreTo =
      returnFocusRef?.current ?? previouslyFocusedRef.current;
    restoreTo?.focus?.();
  }, [mounted, unlockScroll, returnFocusRef]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fs-drawer"
      data-open={open && !closing ? "true" : "false"}
      data-closing={closing ? "true" : undefined}
    >
      <div
        className={
          backdropClassName
            ? `fs-drawer__backdrop ${backdropClassName}`
            : "fs-drawer__backdrop"
        }
        aria-hidden="true"
        onClick={closing ? undefined : onClose}
      />
      <div
        ref={panelRef}
        className={
          panelClassName
            ? `fs-drawer__panel ${panelClassName}`
            : "fs-drawer__panel"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <span id={titleId} className="fs-drawer__sr-title">
          {title}
        </span>
        {children}
      </div>
    </div>,
    document.body,
  );
}
