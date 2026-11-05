// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The slice of Safelight's extension API this extension touches, mirrored from
// the app's src/extensions/types.ts, src/extensions/ui-kit.tsx,
// src/project/project-store.ts, src/project/scan.ts, src/project/folder-ops.ts,
// src/state/ui-store.ts and src/ui/components/ConfirmDialog.tsx. Extensions are
// standalone bundles, so the host's source is not on the type path; React types
// come from @types/react (dev only).

import type { ComponentType } from "react";

export interface StoreApi<T> {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState(): T;
  setState(partial: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(listener: (state: T, prev: T) => void): () => void;
}

/** One folder of the open project. */
export interface FolderNode {
  name: string;
  /** Path relative to the project root; "" for the root itself. */
  path: string;
  children: FolderNode[];
  /** Direct (non-recursive) photo count. */
  count: number;
}

export interface ProjectStoreState {
  /** The open folder's name; "" with none open. */
  name: string;
  /** The open folder's tree; null until it has been scanned. */
  tree: FolderNode | null;
  /** True while a folder is being opened. */
  opening: boolean;
  /** Ask for a folder and open it. */
  openProjectPicker(): Promise<void>;
}

export interface UIStoreState {
  /** The folder the grid shows (a project-relative path), or null for all. */
  activeFolder: string | null;
  setActiveFolder(path: string | null): void;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" paints the confirm button in the destructive red. */
  variant?: "default" | "danger";
}

/** The project folder's tree, as the Folders panel edits it. Paths are
 *  relative to the project root ("" is the root). Each operation moves the
 *  files on disk and updates the catalogue and the tree. */
export interface ProjectAPI {
  /** Create a subfolder under `parentRel`. Returns its relative path, or null. */
  createFolder(parentRel: string, name: string): Promise<string | null>;
  /** Rename a folder in place. No-op for the root or empty names. */
  renameFolder(rel: string, newName: string): Promise<void>;
  /** Move a folder into `destParentRel`. */
  moveFolder(srcRel: string, destParentRel: string): Promise<void>;
  /** Move photos (by catalogue id) into the folder `destRel`. */
  movePhotos(ids: string[], destRel: string): Promise<void>;
  /** Delete a folder from disk and its photos from the catalogue. No-op for the root. */
  deleteFolder(rel: string): Promise<void>;
}

export interface PanelDockDefault {
  module: "library" | "develop";
  direction: "left" | "right" | "bottom";
  order?: number;
  width?: number;
  height?: number;
}

export interface PanelContribution {
  /** Globally unique, e.g. "core.histogram" or "my-ext.fancy-curves". */
  id: string;
  title: string;
  component: ComponentType;
  defaultDock?: PanelDockDefault;
}

/** A stylesheet applied to every app window after the core styles. Extension
 *  rules are unlayered, so they win over Tailwind utility classes at equal or
 *  lower specificity; disabling the extension removes the sheet. */
export interface StylesheetContribution {
  id: string;
  css: string;
}

/** The theme's CSS variables as `var(--color-…)` strings. */
export interface UiTokens {
  readonly surface1: string;
  readonly surface2: string;
  readonly surface3: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly accent: string;
  readonly labelRed: string;
}

export interface SafelightAPI {
  version: 1;
  extensionId: string;
  react: typeof import("react");
  registerPanel(c: PanelContribution): void;
  registerStylesheet(c: StylesheetContribution): void;
  ui: {
    tokens: UiTokens;
    /** Ask in the app's own dialogue card; resolves true on confirm. */
    confirmDialog(options: ConfirmDialogOptions): Promise<boolean>;
  };
  stores: {
    useUIStore: StoreApi<UIStoreState>;
    useProjectStore: StoreApi<ProjectStoreState>;
  };
  project: ProjectAPI;
}

export interface ExtensionModule {
  activate(api: SafelightAPI): void;
  deactivate?(): void;
}
