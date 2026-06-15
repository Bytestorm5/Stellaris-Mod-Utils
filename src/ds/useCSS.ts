import { useEffect } from "react";

/** Inject a component's scoped CSS once, keyed by id. */
export function useCSS(id: string, css: string): void {
  useEffect(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}
