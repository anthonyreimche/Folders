// A stand-in Safelight API over real React and zustand. The project store holds
// a folder tree that the folder operations edit the way core's do (create adds
// a child and returns its path, rename and delete change the tree, delete also
// clears a selection inside the folder); moves are only recorded. Every
// operation is recorded, and so is every registration. Confirm requests wait
// in `confirms` until the test answers them.

import * as React from "react";
import { create } from "zustand";
import type {
  ConfirmDialogOptions,
  FolderNode,
  PanelContribution,
  ProjectStoreState,
  SafelightAPI,
  StoreApi,
  StylesheetContribution,
  UIStoreState,
  UiTokens,
} from "../../src/safelight";

export const TOKENS: UiTokens = {
  surface1: "var(--color-surface-1)",
  surface2: "var(--color-surface-2)",
  surface3: "var(--color-surface-3)",
  textPrimary: "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  textMuted: "var(--color-text-muted)",
  accent: "var(--color-accent)",
  labelRed: "var(--color-label-red)",
};

export type ProjectCall =
  | { op: "createFolder"; parentRel: string; name: string }
  | { op: "renameFolder"; rel: string; newName: string }
  | { op: "moveFolder"; srcRel: string; destParentRel: string }
  | { op: "movePhotos"; ids: string[]; destRel: string }
  | { op: "deleteFolder"; rel: string };

export interface PendingConfirm {
  options: ConfirmDialogOptions;
  resolve(confirmed: boolean): void;
}

export interface Rig {
  api: SafelightAPI;
  ui: StoreApi<UIStoreState>;
  project: StoreApi<ProjectStoreState>;
  /** Every folder operation called, in order. */
  calls: ProjectCall[];
  /** How many times the project picker was asked for. */
  readonly pickerOpens: number;
  confirms: PendingConfirm[];
  panels: PanelContribution[];
  stylesheets: StylesheetContribution[];
}

export const folder = (path: string, children: FolderNode[] = [], count = 0): FolderNode => ({
  name: path.slice(path.lastIndexOf("/") + 1),
  path,
  children,
  count,
});

const joinRel = (dir: string, name: string) => (dir ? `${dir}/${name}` : name);

function mapTree(node: FolderNode, fn: (n: FolderNode) => FolderNode | null): FolderNode | null {
  const next = fn(node);
  if (!next) return null;
  const children = next.children.map((c) => mapTree(c, fn)).filter((c): c is FolderNode => c !== null);
  return { ...next, children };
}

function reroot(node: FolderNode, from: string, to: string): FolderNode {
  const path = node.path === from ? to : `${to}${node.path.slice(from.length)}`;
  return { ...node, path, children: node.children.map((c) => reroot(c, from, to)) };
}

export interface RigOptions {
  name?: string;
  tree?: FolderNode | null;
  activeFolder?: string | null;
  opening?: boolean;
}

export function fakeApi({ name = "pics", tree = null, activeFolder = null, opening = false }: RigOptions = {}): Rig {
  const calls: ProjectCall[] = [];
  const confirms: PendingConfirm[] = [];
  const panels: PanelContribution[] = [];
  const stylesheets: StylesheetContribution[] = [];

  const ui: StoreApi<UIStoreState> = create<UIStoreState>()((set) => ({
    activeFolder,
    setActiveFolder: (path) => set({ activeFolder: path }),
  }));

  let pickerOpens = 0;

  const project: StoreApi<ProjectStoreState> = create<ProjectStoreState>()(() => ({
    name,
    tree,
    opening,
    openProjectPicker: async () => {
      pickerOpens++;
    },
  }));

  const editTree = (fn: (n: FolderNode) => FolderNode | null) => {
    const current = project.getState().tree;
    if (current) project.setState({ tree: mapTree(current, fn) });
  };

  const api: SafelightAPI = {
    version: 1,
    extensionId: "safelight.folders",
    react: React,
    registerPanel: (c) => void panels.push(c),
    registerStylesheet: (c) => void stylesheets.push(c),
    ui: {
      tokens: TOKENS,
      confirmDialog: (options) => new Promise<boolean>((resolve) => void confirms.push({ options, resolve })),
    },
    stores: { useUIStore: ui, useProjectStore: project },
    project: {
      createFolder: async (parentRel, name) => {
        calls.push({ op: "createFolder", parentRel, name });
        const path = joinRel(parentRel, name);
        editTree((n) => (n.path === parentRel ? { ...n, children: [...n.children, folder(path)] } : n));
        return path;
      },
      renameFolder: async (rel, newName) => {
        calls.push({ op: "renameFolder", rel, newName });
        const parent = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
        const to = joinRel(parent, newName);
        editTree((n) => (n.path === rel ? { ...reroot(n, rel, to), name: newName } : n));
      },
      moveFolder: async (srcRel, destParentRel) => void calls.push({ op: "moveFolder", srcRel, destParentRel }),
      movePhotos: async (ids, destRel) => void calls.push({ op: "movePhotos", ids, destRel }),
      deleteFolder: async (rel) => {
        calls.push({ op: "deleteFolder", rel });
        editTree((n) => (n.path === rel ? null : n));
        const active = ui.getState().activeFolder;
        if (active !== null && (active === rel || active.startsWith(`${rel}/`))) ui.getState().setActiveFolder(null);
      },
    },
  };
  return {
    api,
    ui,
    project,
    calls,
    get pickerOpens() {
      return pickerOpens;
    },
    confirms,
    panels,
    stylesheets,
  };
}
