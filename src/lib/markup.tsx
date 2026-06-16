import type { ReactNode } from "react";
import markup from "../data/markup.json";

export interface TextColor {
  code: string;
  rgb: number[];
  label: string;
}

export const COLORS: TextColor[] = (markup as { colors: TextColor[] }).colors;
export const ICONS: string[] = (markup as { icons: string[] }).icons;

const COLOR_CSS = new Map(
  COLORS.map((c) => [c.code, `rgb(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]})`]),
);

export function colorCss(code: string): string | undefined {
  return COLOR_CSS.get(code);
}

/**
 * Render Stellaris localisation markup to React nodes for preview:
 * `§<code>…§!` color spans, `£key£` inline icons, and `\n` line breaks.
 * Data functions (`[...]`) and key refs (`$...$`) are left as literal text.
 */
export function renderMarkup(text: string): ReactNode {
  const out: ReactNode[] = [];
  const stack: string[] = [];
  let buf = "";
  let k = 0;

  const flush = () => {
    if (!buf) return;
    const code = stack[stack.length - 1];
    const css = code ? COLOR_CSS.get(code) : undefined;
    out.push(
      css ? (
        <span key={k++} style={{ color: css }}>
          {buf}
        </span>
      ) : (
        <span key={k++}>{buf}</span>
      ),
    );
    buf = "";
  };

  const re = /§(.)|£([^£|]+)(?:\|[^£]*)?£|\\n|\n/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    buf += text.slice(last, m.index);
    last = re.lastIndex;
    if (m[0].startsWith("§")) {
      flush();
      if (m[1] === "!") stack.pop();
      else stack.push(m[1]);
    } else if (m[0].startsWith("£")) {
      flush();
      out.push(
        <span key={k++} className="mk-icon" title={m[2]}>
          {m[2]}
        </span>,
      );
    } else {
      // newline (literal \n or real)
      flush();
      out.push(<br key={k++} />);
    }
  }
  buf += text.slice(last);
  flush();
  return out;
}
