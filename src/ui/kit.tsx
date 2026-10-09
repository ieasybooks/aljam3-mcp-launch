import React from "react";
import { ICONS } from "./iconData";
import { CHAT } from "./theme";

export const Icon: React.FC<{ name: string; size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties }> = ({
  name,
  size = 18,
  color = CHAT.ink,
  strokeWidth = 2,
  style,
}) => {
  const body = ICONS[name];
  if (!body) throw new Error(`unknown icon ${name}`);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: "block", ...style }}
      dangerouslySetInnerHTML={{ __html: body.replace(/stroke="[^"]*"/g, "").replace(/fill="#[0-9a-fA-F]+"/g, 'fill="currentColor"') }}
    />
  );
};

const DIACRITIC = /[ً-ْٰـ]/;
const strip = (s: string) => s.replace(/[ً-ْٰـ]/g, "");

/** Highlights `mark` (matched ignoring diacritics) inside `text`; `amount` fades the highlight in. */
export const Marked: React.FC<{ text: string; mark: string; amount?: number; color?: string; m?: string }> = ({ text, mark, amount = 1, color = CHAT.mark, m }) => {
  const plain = strip(text);
  const at = plain.indexOf(strip(mark));
  if (at < 0 || amount <= 0) return <>{text}</>;
  let count = -1;
  let start = -1;
  let end = text.length;
  for (let i = 0; i < text.length; i++) {
    if (!DIACRITIC.test(text[i])) count++;
    if (count === at && start < 0) start = i;
    if (count === at + strip(mark).length) {
      end = i;
      break;
    }
  }
  return (
    <>
      {text.slice(0, start)}
      <span data-m={m} style={{ background: `linear-gradient(to left, ${color} ${amount * 100}%, transparent ${amount * 100}%)`, borderRadius: 4, padding: "1px 0", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
        {text.slice(start, end)}
      </span>
      {text.slice(end)}
    </>
  );
};

/** Words of `text` revealed so far for a streamed reply (p = 0..1); unrevealed words keep their space. */
export const Streamed: React.FC<{ text: string; p: number; style?: React.CSSProperties }> = ({ text, p, style }) => {
  const words = text.split(" ");
  const shown = p * words.length;
  return (
    <span style={style}>
      {words.map((w, i) => {
        const a = Math.max(0, Math.min(1, shown - i));
        return (
          <span key={i} style={{ opacity: a }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
};
