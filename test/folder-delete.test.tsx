// Deleting a folder from the Folders panel removes it from disk and its photos
// from the catalogue, so it asks first through the app's confirm dialogue, and a
// cancelled answer must leave both alone. Ported from core's
// folder-delete.test.tsx; the disk and catalogue work is core's deleteFolder, so
// the seam here is api.project.deleteFolder.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FoldersPanel } from "../src/FoldersPanel";
import { React, initRuntime } from "../src/rt";
import { fakeApi, folder, type Rig } from "./support/fake-api";

afterEach(cleanup);

function askToDelete(): Rig {
  const rig = fakeApi({ tree: folder("", [folder("trip", [], 1)]), activeFolder: "trip" });
  initRuntime(rig.api);
  render(<FoldersPanel />);
  fireEvent.click(screen.getByRole("button", { name: "Delete folder" }));
  return rig;
}

async function answer(rig: Rig, confirmed: boolean): Promise<void> {
  await act(async () => rig.confirms[0].resolve(confirmed));
}

describe("Folders panel: delete folder", () => {
  it("asks in the app's dialogue, as a destructive action", () => {
    const rig = askToDelete();
    expect(rig.confirms.map((c) => c.options)).toEqual([
      {
        title: "Delete folder",
        message:
          'Delete the folder "trip" and everything inside it from disk, and remove its photos from the catalogue? This can\'t be undone.',
        confirmLabel: "Delete",
        variant: "danger",
      },
    ]);
    expect(rig.calls).toEqual([]);
  });

  it("deletes the folder once confirmed", async () => {
    const rig = askToDelete();
    await answer(rig, true);
    expect(rig.calls).toEqual([{ op: "deleteFolder", rel: "trip" }]);
    expect(screen.queryByText("trip")).toBeNull();
    expect(rig.ui.getState().activeFolder).toBeNull();
  });

  it("cancelling deletes nothing", async () => {
    const rig = askToDelete();
    await answer(rig, false);
    expect(rig.calls).toEqual([]);
    expect(screen.getByText("trip")).not.toBeNull();
    expect(rig.ui.getState().activeFolder).toBe("trip");
  });

  it("does not select the folder whose delete button was clicked", () => {
    const rig = fakeApi({ tree: folder("", [folder("trip")]) });
    initRuntime(rig.api);
    render(<FoldersPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Delete folder" }));
    expect(rig.ui.getState().activeFolder).toBeNull();
  });
});
