import modifiersData from "../data/modifiers.json";
import ethicsData from "../data/ethics.json";
import authoritiesData from "../data/authorities.json";
import type { Modifier, NamedEntry } from "../types";

export const MODIFIERS: Modifier[] = modifiersData as Modifier[];
export const ETHICS: NamedEntry[] = ethicsData as NamedEntry[];
export const AUTHORITIES: NamedEntry[] = authoritiesData as NamedEntry[];

export const MODIFIER_BY_KEY = new Map(MODIFIERS.map((m) => [m.key, m]));

/** Ordered list of categories with counts, most populous first. */
export const CATEGORIES: string[] = (() => {
  const counts = new Map<string, number>();
  for (const m of MODIFIERS) {
    for (const c of m.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
})();

/** True if a modifier is a multiplier (value is a fraction, 0.1 = +10%). */
export function isMultiplier(key: string): boolean {
  return /_mult$/.test(key);
}

/** A friendly interpretation of a value for the modifier, e.g. "+10%". */
export function interpret(key: string, value: number): string {
  if (!Number.isFinite(value)) return "";
  const sign = value > 0 ? "+" : "";
  if (isMultiplier(key)) {
    return `${sign}${parseFloat((value * 100).toFixed(2))}%`;
  }
  return `${sign}${parseFloat(value.toFixed(4))}`;
}
