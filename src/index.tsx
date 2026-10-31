// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Registers the Library "Folders" panel (the project folder tree). It was
// core's built-in `core.folders` until Safelight 3.2.0 and keeps that panel id,
// so saved layouts keep it where it was.

import { FoldersPanel, foldersCss } from "./FoldersPanel";
import { initRuntime } from "./rt";
import type { SafelightAPI } from "./safelight";

export const PANEL_ID = "core.folders";
export const STYLESHEET_ID = "safelight.folders.styles";

export function activate(host: SafelightAPI): void {
  initRuntime(host);
  host.registerStylesheet({ id: STYLESHEET_ID, css: foldersCss(host.ui.tokens) });
  host.registerPanel({
    id: PANEL_ID,
    title: "Folders",
    component: FoldersPanel,
    defaultDock: { module: "library", direction: "left", order: 0, width: 240 },
  });
}
