// The Folders panel in a DOM, over real zustand UI and project stores: the
// empty state and Open Folder, the tree (labels, indent, counts, collapse),
// selecting a folder, new subfolder and inline rename, and photo and folder
// drops, each reaching core through api.project.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CLASS, DND_FOLDER, DND_PHOTOS, FoldersPanel } from "../src/FoldersPanel";
import { React, initRuntime } from "../src/rt";
import type { FolderNode } from "../src/safelight";
import { fakeApi, folder, type Rig, type RigOptions } from "./support/fake-api";

afterEach(cleanup);

const TREE: FolderNode = folder("", [
  folder("trip", [folder("trip/day 1", [], 4), folder("trip/day 2")], 2),
  folder("misc"),
]);

function mount(options: RigOptions = { tree: TREE }): Rig {
  const rig = fakeApi(options);
  initRuntime(rig.api);
  render(<FoldersPanel />);
  return rig;
}

function row(label: string): HTMLElement {
  const el = screen.getByText(label).closest<HTMLElement>(`.${CLASS.row}`);
  if (!el) throw new Error(`no row for ${label}`);
  return el;
}

function buttonIn(el: HTMLElement, title: string): HTMLButtonElement | null {
  return el.querySelector<HTMLButtonElement>(`button[title="${title}"]`);
}

function toggleOf(el: HTMLElement): HTMLButtonElement | null {
  return el.querySelector<HTMLButtonElement>(`.${CLASS.toggle}`);
}

/** jsdom has no DataTransfer; this one holds what a drag carries. */
function transfer(data: Record<string, string> = {}) {
  const store = new Map(Object.entries(data));
  return {
    get types() {
      return [...store.keys()];
    },
    getData: (type: string) => store.get(type) ?? "",
    setData: (type: string, value: string) => void store.set(type, value),
    effectAllowed: "uninitialized",
    dropEffect: "none",
  };
}

describe("FoldersPanel with no project open", () => {
  it("explains how to start and offers Open Folder", () => {
    const rig = mount({ tree: null });
    expect(screen.getByText(/Open a folder to start/).className).toBe(CLASS.empty);
    const open = screen.getByRole("button", { name: "Open Folder…" });
    expect(open.className).toBe(CLASS.open);
    fireEvent.click(open);
    expect(rig.pickerOpens).toBe(1);
  });

  it("shows Opening… and disables the button while a folder opens", () => {
    const rig = mount({ tree: null, opening: true });
    const button = screen.getByRole<HTMLButtonElement>("button", { name: "Opening…" });
    expect(button.disabled).toBe(true);
    act(() => rig.project.setState({ opening: false, tree: TREE }));
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Open Folder…" }).disabled).toBe(false);
    expect(screen.queryByText(/Open a folder to start/)).toBeNull();
  });
});

describe("FoldersPanel tree", () => {
  it("labels the root with the project name, falling back to its folder name", () => {
    mount({ name: "Holiday", tree: TREE });
    expect(row("Holiday")).not.toBeNull();
    cleanup();
    mount({ name: "", tree: { ...TREE, name: "pics" } });
    expect(row("pics")).not.toBeNull();
  });

  it("indents 12 px per level from 8 px at the root", () => {
    mount();
    expect(row("pics").style.paddingLeft).toBe("8px");
    expect(row("trip").style.paddingLeft).toBe("20px");
    expect(row("day 1").style.paddingLeft).toBe("32px");
    expect(row("misc").style.paddingLeft).toBe("20px");
  });

  it("shows a photo count only on folders that hold photos", () => {
    mount();
    expect(row("trip").querySelector(`.${CLASS.count}`)?.textContent).toBe("2");
    expect(row("day 1").querySelector(`.${CLASS.count}`)?.textContent).toBe("4");
    expect(row("misc").querySelector(`.${CLASS.count}`)).toBeNull();
  });

  it("gives folders with subfolders a disclosure toggle, and the rest a spacer", () => {
    mount();
    expect(toggleOf(row("trip"))?.textContent).toBe("▾");
    expect(toggleOf(row("misc"))).toBeNull();
    expect(row("misc").querySelector(`.${CLASS.spacer}`)).not.toBeNull();
    expect(toggleOf(row("pics"))).toBeNull();
  });

  it("collapses and expands a subtree without selecting the folder", () => {
    const rig = mount();
    fireEvent.click(toggleOf(row("trip"))!);
    expect(screen.queryByText("day 1")).toBeNull();
    expect(toggleOf(row("trip"))?.textContent).toBe("▸");
    expect(rig.ui.getState().activeFolder).toBeNull();
    fireEvent.click(toggleOf(row("trip"))!);
    expect(screen.getByText("day 1")).not.toBeNull();
  });

  it("selects the clicked folder and marks it active", () => {
    const rig = mount();
    fireEvent.click(row("day 1"));
    expect(rig.ui.getState().activeFolder).toBe("trip/day 1");
    expect(row("day 1").className).toBe(`${CLASS.row} ${CLASS.rowActive}`);
    expect(row("trip").className).toBe(`${CLASS.row} ${CLASS.rowIdle}`);
    fireEvent.click(row("pics"));
    expect(rig.ui.getState().activeFolder).toBe("");
    expect(row("pics").className).toBe(`${CLASS.row} ${CLASS.rowActive}`);
  });

  it("follows the selection and the tree when they change elsewhere", () => {
    const rig = mount();
    act(() => rig.ui.getState().setActiveFolder("misc"));
    expect(row("misc").className).toContain(CLASS.rowActive);
    act(() => rig.project.setState({ tree: folder("", [folder("misc"), folder("new")]) }));
    expect(screen.queryByText("trip")).toBeNull();
    expect(row("new")).not.toBeNull();
  });

  it("offers only New subfolder on the root, which cannot be dragged", () => {
    mount();
    const root = row("pics");
    expect(buttonIn(root, "New subfolder")).not.toBeNull();
    expect(buttonIn(root, "Rename folder")).toBeNull();
    expect(buttonIn(root, "Delete folder")).toBeNull();
    expect(root.getAttribute("draggable")).toBe("false");
    const trip = row("trip");
    expect([...trip.querySelectorAll(`.${CLASS.action}`)].map((b) => b.getAttribute("title"))).toEqual([
      "New subfolder",
      "Rename folder",
      "Delete folder",
    ]);
    expect(buttonIn(trip, "Delete folder")?.className).toBe(`${CLASS.action} ${CLASS.actionDanger}`);
    expect(trip.getAttribute("draggable")).toBe("true");
  });
});

describe("FoldersPanel new subfolder and rename", () => {
  it("creates a uniquely named subfolder and opens it for renaming", async () => {
    const rig = mount({ tree: folder("", [folder("Untitled Folder")]) });
    await act(async () => {
      fireEvent.click(buttonIn(row("pics"), "New subfolder")!);
    });
    expect(rig.calls).toEqual([{ op: "createFolder", parentRel: "", name: "Untitled Folder 2" }]);
    expect(rig.ui.getState().activeFolder).toBeNull();
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Folder name" });
    expect(input.value).toBe("Untitled Folder 2");
    expect(input.className).toBe(CLASS.nameInput);
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, "Untitled Folder 2".length]);
    fireEvent.change(input, { target: { value: "Trip" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(rig.calls.at(-1)).toEqual({ op: "renameFolder", rel: "Untitled Folder 2", newName: "Trip" });
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("creates subfolders inside the folder whose button was clicked", async () => {
    const rig = mount();
    await act(async () => {
      fireEvent.click(buttonIn(row("trip"), "New subfolder")!);
    });
    expect(rig.calls).toEqual([{ op: "createFolder", parentRel: "trip", name: "Untitled Folder" }]);
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Folder name" }).value).toBe("Untitled Folder");
  });

  it("renames in place on Enter", () => {
    const rig = mount();
    fireEvent.click(buttonIn(row("misc"), "Rename folder")!);
    expect(rig.ui.getState().activeFolder).toBeNull();
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Folder name" });
    expect(input.value).toBe("misc");
    expect(input.closest(`.${CLASS.row}`)?.getAttribute("draggable")).toBe("false");
    expect(input.closest(`.${CLASS.row}`)?.querySelector(`.${CLASS.actions}`)).toBeNull();
    fireEvent.click(input);
    expect(rig.ui.getState().activeFolder).toBeNull();
    fireEvent.change(input, { target: { value: "Odds" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(rig.calls).toEqual([{ op: "renameFolder", rel: "misc", newName: "Odds" }]);
    expect(row("Odds")).not.toBeNull();
  });

  it("commits when the field loses focus", () => {
    const rig = mount();
    fireEvent.click(buttonIn(row("misc"), "Rename folder")!);
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Folder name" });
    fireEvent.change(input, { target: { value: "Odds" } });
    fireEvent.blur(input);
    expect(rig.calls).toEqual([{ op: "renameFolder", rel: "misc", newName: "Odds" }]);
  });

  it("cancels on Escape, and the next rename commits again", () => {
    const rig = mount();
    fireEvent.click(buttonIn(row("misc"), "Rename folder")!);
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Folder name" });
    fireEvent.change(input, { target: { value: "Odds" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(rig.calls).toEqual([]);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(row("misc")).not.toBeNull();
    fireEvent.click(buttonIn(row("misc"), "Rename folder")!);
    const again = screen.getByRole<HTMLInputElement>("textbox", { name: "Folder name" });
    fireEvent.change(again, { target: { value: "Odds" } });
    fireEvent.keyDown(again, { key: "Enter" });
    expect(rig.calls).toEqual([{ op: "renameFolder", rel: "misc", newName: "Odds" }]);
  });
});

describe("FoldersPanel drag and drop", () => {
  it("carries a dragged folder's path as a move", () => {
    mount();
    const dataTransfer = transfer();
    fireEvent.dragStart(row("day 2"), { dataTransfer });
    expect(dataTransfer.getData(DND_FOLDER)).toBe("trip/day 2");
    expect(dataTransfer.effectAllowed).toBe("move");
  });

  it("accepts photo and folder drags, highlighting the row until the drag leaves", () => {
    mount();
    for (const type of [DND_PHOTOS, DND_FOLDER]) {
      const dataTransfer = transfer({ [type]: "x" });
      expect(fireEvent.dragOver(row("misc"), { dataTransfer })).toBe(false);
      expect(dataTransfer.dropEffect).toBe("move");
      expect(row("misc").className).toBe(`${CLASS.row} ${CLASS.rowDragOver}`);
      fireEvent.dragLeave(row("misc"));
      expect(row("misc").className).toBe(`${CLASS.row} ${CLASS.rowIdle}`);
    }
  });

  it("ignores drags it did not start, such as files from the desktop", () => {
    mount();
    const dataTransfer = transfer({ Files: "" });
    expect(fireEvent.dragOver(row("misc"), { dataTransfer })).toBe(true);
    expect(dataTransfer.dropEffect).toBe("none");
    expect(row("misc").className).toBe(`${CLASS.row} ${CLASS.rowIdle}`);
  });

  it("moves dropped photos into the folder", () => {
    const rig = mount();
    fireEvent.dragOver(row("misc"), { dataTransfer: transfer({ [DND_PHOTOS]: "" }) });
    fireEvent.drop(row("misc"), { dataTransfer: transfer({ [DND_PHOTOS]: JSON.stringify(["a", "b"]) }) });
    expect(rig.calls).toEqual([{ op: "movePhotos", ids: ["a", "b"], destRel: "misc" }]);
    expect(row("misc").className).toBe(`${CLASS.row} ${CLASS.rowIdle}`);
    expect(rig.ui.getState().activeFolder).toBeNull();
  });

  it("moves a dropped folder into the folder, the root included", () => {
    const rig = mount();
    fireEvent.drop(row("misc"), { dataTransfer: transfer({ [DND_FOLDER]: "trip/day 1" }) });
    fireEvent.drop(row("pics"), { dataTransfer: transfer({ [DND_FOLDER]: "trip/day 2" }) });
    expect(rig.calls).toEqual([
      { op: "moveFolder", srcRel: "trip/day 1", destParentRel: "misc" },
      { op: "moveFolder", srcRel: "trip/day 2", destParentRel: "" },
    ]);
  });

  it("does nothing with a drop that carries neither", () => {
    const rig = mount();
    fireEvent.drop(row("misc"), { dataTransfer: transfer({ "text/plain": "hello" }) });
    expect(rig.calls).toEqual([]);
  });
});
