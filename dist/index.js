//#region src/folder-names.ts
function e(e, t = "Untitled Folder") {
	let n = new Set(e);
	if (!n.has(t)) return t;
	for (let e = 2;; e++) if (!n.has(`${t} ${e}`)) return `${t} ${e}`;
}
//#endregion
//#region src/rt.ts
var t, n;
function r(e) {
	n = e, t = e.react;
}
//#endregion
//#region src/FoldersPanel.tsx
var i = "application/x-safelight-folder", a = "safelight-folders", o = {
	panel: a,
	empty: `${a}-empty`,
	open: `${a}-open`,
	row: `${a}-row`,
	rowIdle: `${a}-row-idle`,
	rowActive: `${a}-row-active`,
	rowDragOver: `${a}-row-dragover`,
	toggle: `${a}-toggle`,
	spacer: `${a}-spacer`,
	name: `${a}-name`,
	nameInput: `${a}-name-input`,
	actions: `${a}-actions`,
	action: `${a}-action`,
	actionDanger: `${a}-action-danger`,
	count: `${a}-count`
};
function s(e) {
	let t = o;
	return `
:where(.${t.panel}) { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.5rem; }
:where(.${t.empty}) { padding: 0.25rem 0.5rem; font-size: 11px; color: ${e.textMuted}; }
:where(.${t.open}) { width: 100%; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.25rem 0.5rem; text-align: left; font-size: 11px; color: ${e.textSecondary}; }
@media (hover: hover) { :where(.${t.open}:hover) { background-color: ${e.surface3}; color: ${e.textPrimary}; } }
:where(.${t.open}:disabled) { opacity: 0.5; }
:where(.${t.row}) { display: flex; cursor: pointer; align-items: center; gap: 0.25rem; border-radius: 0.25rem; padding-block: 0.25rem; padding-right: 0.25rem; font-size: 11px; }
:where(.${t.rowDragOver}) { background-color: color-mix(in oklab, ${e.accent} 20%, transparent); box-shadow: 0 0 0 1px ${e.accent}; }
:where(.${t.rowActive}) { background-color: ${e.surface3}; color: ${e.textPrimary}; }
:where(.${t.rowIdle}) { color: ${e.textSecondary}; }
@media (hover: hover) { :where(.${t.rowIdle}:hover) { background-color: ${e.surface2}; color: ${e.textPrimary}; } }
:where(.${t.toggle}) { width: 0.75rem; flex-shrink: 0; color: ${e.textMuted}; }
@media (hover: hover) { :where(.${t.toggle}:hover) { color: ${e.textPrimary}; } }
:where(.${t.spacer}) { width: 0.75rem; flex-shrink: 0; }
:where(.${t.name}) { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where(.${t.nameInput}) { min-width: 0; flex: 1; border-radius: 0.25rem; background-color: ${e.surface1}; padding-inline: 0.25rem; font-size: 11px; color: ${e.textPrimary}; outline-style: none; box-shadow: 0 0 0 1px ${e.accent}; }
:where(.${t.actions}) { display: flex; flex-shrink: 0; align-items: center; gap: 0.125rem; }
:where(.${t.action}) { display: none; width: 1rem; color: ${e.textMuted}; }
@media (hover: hover) { :where(.${t.row}:hover .${t.action}) { display: block; } :where(.${t.action}:hover) { color: ${e.textPrimary}; } :where(.${t.actionDanger}:hover) { color: ${e.labelRed}; } }
:where(.${t.count}) { margin-left: 0.125rem; color: ${e.textMuted}; }
html.sl-larger-text .${t.empty}, html.sl-larger-text .${t.open}, html.sl-larger-text .${t.row}, html.sl-larger-text .${t.nameInput} { font-size: 13px !important; line-height: 1.45 !important; }
`;
}
function c() {
	let { useUIStore: r, useProjectStore: i } = n.stores, a = r((e) => e.activeFolder), s = r((e) => e.setActiveFolder), c = i((e) => e.name), d = i((e) => e.tree), f = i((e) => e.opening), p = i((e) => e.openProjectPicker), [m, h] = t.useState(null), g = {
		activeFolder: a,
		onSelect: s,
		editing: m,
		setEditing: h,
		onNewFolder: async (t) => {
			let r = e(t.children.map((e) => e.name)), i = await n.project.createFolder(t.path, r);
			i && h(i);
		}
	};
	return /* @__PURE__ */ t.createElement("div", { className: o.panel }, d ? /* @__PURE__ */ t.createElement(t.Fragment, null, /* @__PURE__ */ t.createElement(u, {
		node: d,
		depth: 0,
		label: c || d.name,
		ctx: g
	}), d.children.map((e) => /* @__PURE__ */ t.createElement(l, {
		key: e.path,
		node: e,
		depth: 1,
		ctx: g
	}))) : /* @__PURE__ */ t.createElement("p", { className: o.empty }, "Open a folder to start — its images are decoded and cached in a .safelight working directory inside it."), /* @__PURE__ */ t.createElement("button", {
		onClick: () => void p(),
		disabled: f,
		className: o.open
	}, f ? "Opening…" : "Open Folder…"));
}
function l({ node: e, depth: n, ctx: r }) {
	let [i, a] = t.useState(!0);
	return /* @__PURE__ */ t.createElement(t.Fragment, null, /* @__PURE__ */ t.createElement(u, {
		node: e,
		depth: n,
		ctx: r,
		expanded: e.children.length > 0 ? i : void 0,
		onToggle: () => a((e) => !e)
	}), i && e.children.map((e) => /* @__PURE__ */ t.createElement(l, {
		key: e.path,
		node: e,
		depth: n + 1,
		ctx: r
	})));
}
function u({ node: e, depth: r, label: a, ctx: s, expanded: c, onToggle: l }) {
	let u = s.activeFolder === e.path, d = e.path === "", f = s.editing === e.path, [p, m] = t.useState(!1), h = t.useRef(null), g = t.useRef(!1);
	t.useEffect(() => {
		f && h.current?.select();
	}, [f]);
	let _ = (t) => {
		s.setEditing(null), g.current ? g.current = !1 : n.project.renameFolder(e.path, t);
	}, v = async () => {
		await n.ui.confirmDialog({
			title: "Delete folder",
			message: `Delete the folder "${e.name}" and everything inside it from disk, and remove its photos from the catalogue? This can't be undone.`,
			confirmLabel: "Delete",
			variant: "danger"
		}) && n.project.deleteFolder(e.path);
	}, y = (t) => {
		t.preventDefault(), t.stopPropagation(), m(!1);
		let r = t.dataTransfer.getData("application/x-safelight-photos");
		if (r) {
			n.project.movePhotos(JSON.parse(r), e.path);
			return;
		}
		let a = t.dataTransfer.getData(i);
		a && n.project.moveFolder(a, e.path);
	}, b = p ? o.rowDragOver : u ? o.rowActive : o.rowIdle;
	return /* @__PURE__ */ t.createElement("div", {
		draggable: !d && !f,
		onDragStart: (t) => {
			t.dataTransfer.setData(i, e.path), t.dataTransfer.effectAllowed = "move";
		},
		onDragOver: (e) => {
			let t = e.dataTransfer.types;
			(t.includes("application/x-safelight-photos") || t.includes("application/x-safelight-folder")) && (e.preventDefault(), e.dataTransfer.dropEffect = "move", p || m(!0));
		},
		onDragLeave: () => m(!1),
		onDrop: y,
		onClick: () => s.onSelect(e.path),
		style: { paddingLeft: 8 + r * 12 },
		className: `${o.row} ${b}`
	}, c === void 0 ? /* @__PURE__ */ t.createElement("span", { className: o.spacer }) : /* @__PURE__ */ t.createElement("button", {
		onClick: (e) => {
			e.stopPropagation(), l?.();
		},
		className: o.toggle
	}, c ? "▾" : "▸"), f ? /* @__PURE__ */ t.createElement("input", {
		ref: h,
		defaultValue: e.name,
		autoFocus: !0,
		"aria-label": "Folder name",
		onClick: (e) => e.stopPropagation(),
		onKeyDown: (e) => {
			e.key === "Enter" ? e.currentTarget.blur() : e.key === "Escape" && (g.current = !0, e.currentTarget.blur());
		},
		onBlur: (e) => _(e.currentTarget.value),
		className: o.nameInput
	}) : /* @__PURE__ */ t.createElement("span", { className: o.name }, a ?? e.name), !f && /* @__PURE__ */ t.createElement("div", { className: o.actions }, /* @__PURE__ */ t.createElement("button", {
		title: "New subfolder",
		onClick: (t) => {
			t.stopPropagation(), s.onNewFolder(e);
		},
		className: o.action
	}, "+"), !d && /* @__PURE__ */ t.createElement(t.Fragment, null, /* @__PURE__ */ t.createElement("button", {
		title: "Rename folder",
		onClick: (t) => {
			t.stopPropagation(), s.setEditing(e.path);
		},
		"aria-label": "Rename folder",
		className: o.action
	}, "✎"), /* @__PURE__ */ t.createElement("button", {
		title: "Delete folder",
		"aria-label": "Delete folder",
		onClick: (e) => {
			e.stopPropagation(), v();
		},
		className: `${o.action} ${o.actionDanger}`
	}, "🗑")), e.count > 0 && /* @__PURE__ */ t.createElement("span", { className: o.count }, e.count)));
}
//#endregion
//#region src/index.tsx
var d = "core.folders", f = "safelight.folders.styles";
function p(e) {
	r(e), e.registerStylesheet({
		id: f,
		css: s(e.ui.tokens)
	}), e.registerPanel({
		id: d,
		title: "Folders",
		component: c,
		defaultDock: {
			module: "library",
			direction: "left",
			order: 0,
			width: 240
		}
	});
}
//#endregion
export { d as PANEL_ID, f as STYLESHEET_ID, p as activate };

//# sourceMappingURL=index.js.map