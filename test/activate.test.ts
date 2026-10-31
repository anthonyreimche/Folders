// What activate() registers: the Folders panel under core's old panel id, title
// and dock spot (so saved layouts keep it), and the stylesheet that gives it
// core's look.

import { describe, expect, it } from "vitest";
import { CLASS, FoldersPanel } from "../src/FoldersPanel";
import { PANEL_ID, STYLESHEET_ID, activate } from "../src/index";
import { fakeApi } from "./support/fake-api";

describe("activate", () => {
  it("registers exactly the Folders panel, as core's core.folders did", () => {
    const rig = fakeApi();
    activate(rig.api);
    expect(rig.panels).toHaveLength(1);
    expect(rig.panels[0]).toEqual({
      id: "core.folders",
      title: "Folders",
      component: FoldersPanel,
      defaultDock: { module: "library", direction: "left", order: 0, width: 240 },
    });
    expect(PANEL_ID).toBe("core.folders");
  });

  it("registers one stylesheet for the panel's classes, coloured from the theme tokens", () => {
    const rig = fakeApi();
    activate(rig.api);
    expect(rig.stylesheets.map((s) => s.id)).toEqual([STYLESHEET_ID]);
    const css = rig.stylesheets[0].css;
    expect(css).toContain(`:where(.${CLASS.open}) {`);
    expect(css).toContain(`:where(.${CLASS.row}) {`);
    expect(css).toContain(
      `:where(.${CLASS.rowActive}) { background-color: var(--color-surface-3); color: var(--color-text-primary); }`,
    );
    expect(css).toContain(
      `:where(.${CLASS.rowDragOver}) { background-color: color-mix(in oklab, var(--color-accent) 20%, transparent); box-shadow: 0 0 0 1px var(--color-accent); }`,
    );
    expect(css).toContain(`:where(.${CLASS.row}:hover .${CLASS.action}) { display: block; }`);
    expect(css).toContain(`:where(.${CLASS.actionDanger}:hover) { color: var(--color-label-red); }`);
    expect(css).toContain(`:where(.${CLASS.open}:disabled) { opacity: 0.5; }`);
  });

  it("keeps every rule but Larger text at zero specificity", () => {
    const rig = fakeApi();
    activate(rig.api);
    const rules = rig.stylesheets[0].css
      .split("\n")
      .filter((line) => line.includes("safelight-folders"))
      .filter((line) => !line.startsWith("html.sl-larger-text"));
    const selectors = rules.flatMap((line) => line.match(/[^{}]+(?=\{)/g) ?? []).map((s) => s.trim());
    const plain = selectors.filter((s) => !s.startsWith("@media") && !s.startsWith(":where("));
    expect(plain).toEqual([]);
  });

  it("enlarges the panel's 11 px text under Accessibility ▸ Larger text", () => {
    const rig = fakeApi();
    activate(rig.api);
    const rule = rig.stylesheets[0].css.split("\n").find((line) => line.startsWith("html.sl-larger-text"));
    for (const c of [CLASS.empty, CLASS.open, CLASS.row, CLASS.nameInput]) {
      expect(rule).toContain(`html.sl-larger-text .${c}`);
    }
    expect(rule).toContain("font-size: 13px !important; line-height: 1.45 !important;");
  });
});
