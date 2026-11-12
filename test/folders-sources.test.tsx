// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Library sources (Safelight 3.2.4: photos kept on a server, opened like a
// folder) in the Folders panel: each is a row like a folder's that opens it,
// and once open its folders are the tree, which then offers no changes: a
// source is never written.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { create } from "zustand";
import { CLASS, DND_PHOTOS, FoldersPanel } from "../src/FoldersPanel";
import { React, initRuntime } from "../src/rt";
import type { FolderNode, LibrarySourceEntry } from "../src/safelight";
import { fakeApi, folder, type RigOptions } from "./support/fake-api";

afterEach(cleanup);

const LOCAL: FolderNode = folder("", [folder("trip", [], 2)]);
const ALBUMS: FolderNode = folder("", [folder("Summer", [], 12), folder("Family", [], 3)]);

function mount(options: RigOptions) {
  const rig = fakeApi(options);
  const state = create<{ open: string | null }>()(() => ({ open: null }));
  const opened: string[] = [];
  const entries = (open: string | null): LibrarySourceEntry[] => [
    { id: "immich", name: "Immich", extensionId: "ext.immich", open: open === "immich" },
  ];
  rig.api.library = {
    useSources: () => entries(state((s) => s.open)),
    useOpenSource: () => (state((s) => s.open) ? { id: "immich", name: "Immich" } : null),
    openSource: async (id) => {
      opened.push(id);
    },
  };
  initRuntime(rig.api);
  render(<FoldersPanel />);
  return { rig, state, opened };
}

const rowOf = (label: string) => screen.getByText(label).closest<HTMLElement>(`.${CLASS.row}`)!;

describe("library sources in the Folders panel", () => {
  it("are rows like a folder's, below the project's tree, that open the source", () => {
    const { opened } = mount({ name: "pics", tree: LOCAL });
    const source = rowOf("Immich");
    expect(source.className).toBe(`${CLASS.row} ${CLASS.rowIdle}`);
    expect(source.getAttribute("title")).toBe("Open Immich");
    expect(source.compareDocumentPosition(rowOf("trip")) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(source.querySelector("button")).toBeNull();
    fireEvent.click(source);
    expect(opened).toEqual(["immich"]);
  });

  it("are offered with no project open too", () => {
    mount({ tree: null });
    expect(rowOf("Immich")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Open Folder…" })).not.toBeNull();
  });

  it("once open, show their folders as the tree, with no row of their own", () => {
    const { rig, state } = mount({ name: "pics", tree: LOCAL });
    act(() => {
      rig.project.setState({ name: "Immich", tree: ALBUMS });
      state.setState({ open: "immich" });
    });
    expect(screen.getAllByText("Immich")).toHaveLength(1);
    expect(rowOf("Immich").getAttribute("title")).toBeNull();
    fireEvent.click(rowOf("Summer"));
    expect(rig.ui.getState().activeFolder).toBe("Summer");
  });

  it("once open, offer no new folder, rename, delete, drag or drop", () => {
    const { rig, state } = mount({ name: "Immich", tree: ALBUMS });
    act(() => state.setState({ open: "immich" }));
    for (const label of ["Immich", "Summer", "Family"]) {
      const row = rowOf(label);
      expect(row.querySelectorAll("button")).toHaveLength(0);
      expect(row.getAttribute("draggable")).toBe("false");
    }
    expect(rowOf("Summer").textContent).toContain("12");
    const data = new Map([[DND_PHOTOS, '["p1"]']]);
    const dataTransfer = {
      types: [...data.keys()],
      getData: (t: string) => data.get(t) ?? "",
      dropEffect: "none",
    };
    fireEvent.dragOver(rowOf("Family"), { dataTransfer });
    expect(rowOf("Family").className).not.toContain(CLASS.rowDragOver);
    fireEvent.drop(rowOf("Family"), { dataTransfer });
    expect(rig.calls).toEqual([]);
  });
});
