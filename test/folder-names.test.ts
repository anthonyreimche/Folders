// The new-subfolder name, ported from core's folder-ops tests.

import { describe, expect, it } from "vitest";
import { uniqueFolderName } from "../src/folder-names";

describe("uniqueFolderName", () => {
  it("keeps the base name when it's free", () => {
    expect(uniqueFolderName(["Trip", "Misc"])).toBe("Untitled Folder");
    expect(uniqueFolderName([], "Trip")).toBe("Trip");
  });

  it("suffixes with the first free index", () => {
    expect(uniqueFolderName(["Trip"], "Trip")).toBe("Trip 2");
    expect(uniqueFolderName(["Trip", "Trip 2", "Trip 3"], "Trip")).toBe("Trip 4");
    expect(uniqueFolderName(["Trip", "Trip 3"], "Trip")).toBe("Trip 2");
  });
});
