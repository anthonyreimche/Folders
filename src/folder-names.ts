// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

/** Generate a folder name not already used among `siblingNames`. A copy of
 *  core's `uniqueFolderName` (src/project/folder-ops.ts). */
export function uniqueFolderName(siblingNames: string[], base = "Untitled Folder"): string {
  const taken = new Set(siblingNames);
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base} ${i}`)) return `${base} ${i}`;
}
