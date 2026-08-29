/** Joins class names, dropping falsy values. Keeps a clsx dependency unnecessary. */
export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}
