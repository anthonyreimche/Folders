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
:where(.${t.row}) { display: flex; cursor: pointer; align-items: center; gap: 0.25rem; border-radius: 0.25rem; padding-block: 0.25rem; padding-right: 0.25rem; font-size: 11px; }
:where(.${t.rowDragOver}) { background-color: color-mix(in oklab, ${e.accent} 20%, transparent); box-shadow: 0 0 0 1px ${e.accent}; }
:where(.${t.rowActive}) { background-color: ${e.surface3}; color: ${e.textPrimary}; }
:where(.${t.rowIdle}) { color: ${e.textSecondary}; }
@media (hover: hover) { :where(.${t.rowIdle}:hover) { background-color: ${e.surface2}; color: ${e.textPrimary}; } }
:where(.${t.toggle}) { flex-shrink: 0; }
:where(.${t.spacer}) { width: 0.75rem; flex-shrink: 0; }
:where(.${t.name}) { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where(.${t.nameInput}) { min-width: 0; flex: 1; }
:where(.${t.actions}) { display: flex; flex-shrink: 0; align-items: center; gap: 0.125rem; }
:where(.${t.action}) { display: none; }
@media (hover: hover) { :where(.${t.row}:hover .${t.action}) { display: inline-flex; } :where(.${t.actionDanger}:hover) { color: ${e.labelRed}; } }
:where(.${t.count}) { margin-left: 0.125rem; color: ${e.textMuted}; }
html.sl-larger-text .${t.empty}, html.sl-larger-text .${t.row} { font-size: 13px !important; line-height: 1.45 !important; }
`;
}
var c = [];
function l() {
	let { Button: r } = n.ui, { useUIStore: i, useProjectStore: a } = n.stores, s = i((e) => e.activeFolder), l = i((e) => e.setActiveFolder), f = a((e) => e.name), p = a((e) => e.tree), m = a((e) => e.opening), h = a((e) => e.openProjectPicker), g = (n.library?.useSources ?? (() => c))(), _ = (n.library?.useOpenSource ?? (() => null))(), [v, y] = t.useState(null), b = {
		readOnly: _ !== null,
		activeFolder: s,
		onSelect: l,
		editing: v,
		setEditing: y,
		onNewFolder: async (t) => {
			let r = e(t.children.map((e) => e.name)), i = await n.project.createFolder(t.path, r);
			i && y(i);
		}
	};
	return /* @__PURE__ */ t.createElement("div", { className: o.panel }, p ? /* @__PURE__ */ t.createElement(t.Fragment, null, /* @__PURE__ */ t.createElement(d, {
		node: p,
		depth: 0,
		label: f || p.name,
		ctx: b
	}), p.children.map((e) => /* @__PURE__ */ t.createElement(u, {
		key: e.path,
		node: e,
		depth: 1,
		ctx: b
	}))) : /* @__PURE__ */ t.createElement("p", { className: o.empty }, "Open a folder to start — its images are decoded and cached in a .safelight working directory inside it."), g.filter((e) => !e.open).map((e) => /* @__PURE__ */ t.createElement("div", {
		key: e.id,
		title: `Open ${e.name}`,
		onClick: () => {
			m || n.library?.openSource?.(e.id);
		},
		style: { paddingLeft: 8 },
		className: `${o.row} ${o.rowIdle}`
	}, /* @__PURE__ */ t.createElement("span", { className: o.spacer }), /* @__PURE__ */ t.createElement("span", { className: o.name }, e.name))), /* @__PURE__ */ t.createElement(r, {
		full: !0,
		size: "sm",
		onClick: () => void h(),
		disabled: m
	}, m ? "Opening…" : "Open Folder…"));
}
function u({ node: e, depth: n, ctx: r }) {
	let [i, a] = t.useState(!0);
	return /* @__PURE__ */ t.createElement(t.Fragment, null, /* @__PURE__ */ t.createElement(d, {
		node: e,
		depth: n,
		ctx: r,
		expanded: e.children.length > 0 ? i : void 0,
		onToggle: () => a((e) => !e)
	}), i && e.children.map((e) => /* @__PURE__ */ t.createElement(u, {
		key: e.path,
		node: e,
		depth: n + 1,
		ctx: r
	})));
}
function d({ node: e, depth: r, label: a, ctx: s, expanded: c, onToggle: l }) {
	let { Button: u, TextInput: d } = n.ui, f = s.activeFolder === e.path, p = e.path === "", m = s.editing === e.path, [h, g] = t.useState(!1), _ = t.useRef(!1), [v, y] = t.useState(e.name);
	t.useEffect(() => {
		m && y(e.name);
	}, [m, e.name]);
	let b = (t) => {
		s.setEditing(null), _.current ? _.current = !1 : n.project.renameFolder(e.path, t);
	}, x = async () => {
		await n.ui.confirmDialog({
			title: "Delete folder",
			message: `Delete the folder "${e.name}" and everything inside it from disk, and remove its photos from the catalogue? This can't be undone.`,
			confirmLabel: "Delete",
			variant: "danger"
		}) && n.project.deleteFolder(e.path);
	}, S = (t) => {
		if (s.readOnly) return;
		t.preventDefault(), t.stopPropagation(), g(!1);
		let r = t.dataTransfer.getData("application/x-safelight-photos");
		if (r) {
			n.project.movePhotos(JSON.parse(r), e.path);
			return;
		}
		let a = t.dataTransfer.getData(i);
		a && n.project.moveFolder(a, e.path);
	}, C = h ? o.rowDragOver : f ? o.rowActive : o.rowIdle;
	return /* @__PURE__ */ t.createElement("div", {
		draggable: !p && !m && !s.readOnly,
		onDragStart: (t) => {
			t.dataTransfer.setData(i, e.path), t.dataTransfer.effectAllowed = "move";
		},
		onDragOver: (e) => {
			let t = e.dataTransfer.types;
			!s.readOnly && (t.includes("application/x-safelight-photos") || t.includes("application/x-safelight-folder")) && (e.preventDefault(), e.dataTransfer.dropEffect = "move", h || g(!0));
		},
		onDragLeave: () => g(!1),
		onDrop: S,
		onClick: () => s.onSelect(e.path),
		style: { paddingLeft: 8 + r * 12 },
		className: `${o.row} ${C}`
	}, c === void 0 ? /* @__PURE__ */ t.createElement("span", { className: o.spacer }) : /* @__PURE__ */ t.createElement(u, {
		variant: "ghost",
		size: "sm",
		onClick: (e) => {
			e.stopPropagation(), l?.();
		},
		className: o.toggle
	}, c ? "▾" : "▸"), m ? /* @__PURE__ */ t.createElement(d, {
		value: v,
		onChange: y,
		autoFocus: !0,
		onFocus: (e) => e.currentTarget.select(),
		"aria-label": "Folder name",
		onClick: (e) => e.stopPropagation(),
		onKeyDown: (e) => {
			e.key === "Enter" ? e.currentTarget.blur() : e.key === "Escape" && (_.current = !0, e.currentTarget.blur());
		},
		onBlur: (e) => b(e.currentTarget.value),
		className: o.nameInput
	}) : /* @__PURE__ */ t.createElement("span", { className: o.name }, a ?? e.name), s.readOnly ? e.count > 0 && /* @__PURE__ */ t.createElement("div", { className: o.actions }, /* @__PURE__ */ t.createElement("span", { className: o.count }, e.count)) : !m && /* @__PURE__ */ t.createElement("div", { className: o.actions }, /* @__PURE__ */ t.createElement(u, {
		variant: "ghost",
		size: "sm",
		title: "New subfolder",
		onClick: (t) => {
			t.stopPropagation(), s.onNewFolder(e);
		},
		className: o.action
	}, "+"), !p && /* @__PURE__ */ t.createElement(t.Fragment, null, /* @__PURE__ */ t.createElement(u, {
		variant: "ghost",
		size: "sm",
		title: "Rename folder",
		onClick: (t) => {
			t.stopPropagation(), s.setEditing(e.path);
		},
		"aria-label": "Rename folder",
		className: o.action
	}, "✎"), /* @__PURE__ */ t.createElement(u, {
		variant: "ghost",
		size: "sm",
		title: "Delete folder",
		"aria-label": "Delete folder",
		onClick: (e) => {
			e.stopPropagation(), x();
		},
		className: `${o.action} ${o.actionDanger}`
	}, "🗑")), e.count > 0 && /* @__PURE__ */ t.createElement("span", { className: o.count }, e.count)));
}
//#endregion
//#region src/index.tsx
var f = "core.folders", p = "safelight.folders.styles";
function m(e) {
	r(e), e.registerStylesheet({
		id: p,
		css: s(e.ui.tokens)
	}), e.registerPanel({
		id: f,
		title: "Folders",
		component: l,
		defaultDock: {
			module: "library",
			direction: "left",
			order: 0,
			width: 240
		}
	});
}
//#endregion
export { f as PANEL_ID, p as STYLESHEET_ID, m as activate };

//# sourceMappingURL=index.js.map