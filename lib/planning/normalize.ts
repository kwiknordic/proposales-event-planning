// Text normalization for change detection: two texts are "the same" if they differ only in
// case or whitespace. Used by every section diff and by matchByIdentity.

export function normalizeText(text: string | null | undefined): string {
  return (text ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function isSameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeText(a) === normalizeText(b);
}
