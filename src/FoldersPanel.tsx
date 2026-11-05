// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The Library "Folders" panel: the open project's folder tree and Open Folder.
// Rows select the folder the grid shows, take photo and folder drops, and
// offer new subfolder, rename and delete.

import type { DragEvent } from "react";
import { uniqueFolderName } from "./folder-names";
import { React, api } from "./rt";
import type { FolderNode, UiTokens } from "./safelight";

// Drag payload MIME types. Photos carry a JSON id array; a folder carries its
// relative path. Custom types so folder rows only accept our own drags.
export const DND_PHOTOS = "application/x-safelight-photos";
export const DND_FOLDER = "application/x-safelight-folder";

const P = "safelight-folders";

export const CLASS = {
  panel: P,
  empty: `${P}-empty`,
  open: `${P}-open`,
  row: `${P}-row`,
  rowIdle: `${P}-row-idle`,
  rowActive: `${P}-row-active`,
  rowDragOver: `${P}-row-dragover`,
  toggle: `${P}-toggle`,
  spacer: `${P}-spacer`,
  name: `${P}-name`,
  nameInput: `${P}-name-input`,
  actions: `${P}-actions`,
  action: `${P}-action`,
  actionDanger: `${P}-action-danger`,
  count: `${P}-count`,
} as const;

/** The look core gave this panel with Tailwind utilities, as plain CSS (the
 *  app's Tailwind build never scans an extension). `:where()` drops the rules
 *  to zero specificity, so any stylesheet that restyles buttons or inputs wins
 *  over them as it wins over core's layered utilities. The last rule repeats
 *  core's Accessibility ▸ Larger text rule for 11 px text. */
export function foldersCss(t: UiTokens): string {
  const c = CLASS;
  return `
:where(.${c.panel}) { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.5rem; }
:where(.${c.empty}) { padding: 0.25rem 0.5rem; font-size: 11px; color: ${t.textMuted}; }
:where(.${c.open}) { width: 100%; border-radius: 0.25rem; background-color: ${t.surface2}; padding: 0.25rem 0.5rem; text-align: left; font-size: 11px; color: ${t.textSecondary}; }
@media (hover: hover) { :where(.${c.open}:hover) { background-color: ${t.surface3}; color: ${t.textPrimary}; } }
:where(.${c.open}:disabled) { opacity: 0.5; }
:where(.${c.row}) { display: flex; cursor: pointer; align-items: center; gap: 0.25rem; border-radius: 0.25rem; padding-block: 0.25rem; padding-right: 0.25rem; font-size: 11px; }
:where(.${c.rowDragOver}) { background-color: color-mix(in oklab, ${t.accent} 20%, transparent); box-shadow: 0 0 0 1px ${t.accent}; }
:where(.${c.rowActive}) { background-color: ${t.surface3}; color: ${t.textPrimary}; }
:where(.${c.rowIdle}) { color: ${t.textSecondary}; }
@media (hover: hover) { :where(.${c.rowIdle}:hover) { background-color: ${t.surface2}; color: ${t.textPrimary}; } }
:where(.${c.toggle}) { width: 0.75rem; flex-shrink: 0; color: ${t.textMuted}; }
@media (hover: hover) { :where(.${c.toggle}:hover) { color: ${t.textPrimary}; } }
:where(.${c.spacer}) { width: 0.75rem; flex-shrink: 0; }
:where(.${c.name}) { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:where(.${c.nameInput}) { min-width: 0; flex: 1; border-radius: 0.25rem; background-color: ${t.surface1}; padding-inline: 0.25rem; font-size: 11px; color: ${t.textPrimary}; outline-style: none; box-shadow: 0 0 0 1px ${t.accent}; }
:where(.${c.actions}) { display: flex; flex-shrink: 0; align-items: center; gap: 0.125rem; }
:where(.${c.action}) { display: none; width: 1rem; color: ${t.textMuted}; }
@media (hover: hover) { :where(.${c.row}:hover .${c.action}) { display: block; } :where(.${c.action}:hover) { color: ${t.textPrimary}; } :where(.${c.actionDanger}:hover) { color: ${t.labelRed}; } }
:where(.${c.count}) { margin-left: 0.125rem; color: ${t.textMuted}; }
html.sl-larger-text .${c.empty}, html.sl-larger-text .${c.open}, html.sl-larger-text .${c.row}, html.sl-larger-text .${c.nameInput} { font-size: 13px !important; line-height: 1.45 !important; }
`;
}

// Shared row behaviour threaded down the folder tree.
interface FolderTreeCtx {
  activeFolder: string | null;
  onSelect: (path: string) => void;
  editing: string | null;
  setEditing: (path: string | null) => void;
  onNewFolder: (node: FolderNode) => Promise<void>;
}

export function FoldersPanel() {
  const { useUIStore, useProjectStore } = api.stores;
  const activeFolder = useUIStore((s) => s.activeFolder);
  const setActiveFolder = useUIStore((s) => s.setActiveFolder);
  const projectName = useProjectStore((s) => s.name);
  const tree = useProjectStore((s) => s.tree);
  const opening = useProjectStore((s) => s.opening);
  const openProjectPicker = useProjectStore((s) => s.openProjectPicker);

  // relPath of the folder being renamed inline (null = none).
  const [editing, setEditing] = React.useState<string | null>(null);

  // Create a uniquely-named subfolder, then drop straight into rename mode.
  const onNewFolder = async (node: FolderNode) => {
    const name = uniqueFolderName(node.children.map((c) => c.name));
    const created = await api.project.createFolder(node.path, name);
    if (created) setEditing(created);
  };

  const ctx: FolderTreeCtx = {
    activeFolder,
    onSelect: setActiveFolder,
    editing,
    setEditing,
    onNewFolder,
  };

  return (
    <div className={CLASS.panel}>
      {tree ? (
        <>
          <FolderRow node={tree} depth={0} label={projectName || tree.name} ctx={ctx} />
          {tree.children.map((c) => (
            <FolderTree key={c.path} node={c} depth={1} ctx={ctx} />
          ))}
        </>
      ) : (
        <p className={CLASS.empty}>
          Open a folder to start — its images are decoded and cached in a
          .safelight working directory inside it.
        </p>
      )}
      <button onClick={() => void openProjectPicker()} disabled={opening} className={CLASS.open}>
        {opening ? "Opening…" : "Open Folder…"}
      </button>
    </div>
  );
}

// One folder row; subtree rows collapse behind a disclosure toggle.
function FolderTree({ node, depth, ctx }: { node: FolderNode; depth: number; ctx: FolderTreeCtx }) {
  const [expanded, setExpanded] = React.useState(true);
  return (
    <>
      <FolderRow
        node={node}
        depth={depth}
        ctx={ctx}
        expanded={node.children.length > 0 ? expanded : undefined}
        onToggle={() => setExpanded((e) => !e)}
      />
      {expanded && node.children.map((c) => <FolderTree key={c.path} node={c} depth={depth + 1} ctx={ctx} />)}
    </>
  );
}

function FolderRow({
  node,
  depth,
  label,
  ctx,
  expanded,
  onToggle,
}: {
  node: FolderNode;
  depth: number;
  label?: string;
  ctx: FolderTreeCtx;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const isActive = ctx.activeFolder === node.path;
  const isRoot = node.path === "";
  const isEditing = ctx.editing === node.path;
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cancelRef = React.useRef(false);

  React.useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  // Single commit path: Enter/Escape just blur the input, and onBlur decides
  // whether to apply (avoids renaming twice off the now-stale path).
  const commitRename = (value: string) => {
    ctx.setEditing(null);
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    void api.project.renameFolder(node.path, value);
  };

  const handleDelete = async () => {
    const ok = await api.ui.confirmDialog({
      title: "Delete folder",
      message: `Delete the folder "${node.name}" and everything inside it from disk, and remove its photos from the catalogue? This can't be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) void api.project.deleteFolder(node.path);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const photos = e.dataTransfer.getData(DND_PHOTOS);
    if (photos) {
      void api.project.movePhotos(JSON.parse(photos) as string[], node.path);
      return;
    }
    const folder = e.dataTransfer.getData(DND_FOLDER);
    if (folder) void api.project.moveFolder(folder, node.path);
  };

  const state = dragOver ? CLASS.rowDragOver : isActive ? CLASS.rowActive : CLASS.rowIdle;

  return (
    <div
      draggable={!isRoot && !isEditing}
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_FOLDER, node.path);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        const t = e.dataTransfer.types;
        if (t.includes(DND_PHOTOS) || t.includes(DND_FOLDER)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!dragOver) setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => ctx.onSelect(node.path)}
      style={{ paddingLeft: 8 + depth * 12 }}
      className={`${CLASS.row} ${state}`}
    >
      {expanded !== undefined ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className={CLASS.toggle}
        >
          {expanded ? "▾" : "▸"}
        </button>
      ) : (
        <span className={CLASS.spacer} />
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          defaultValue={node.name}
          autoFocus
          aria-label="Folder name"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            else if (e.key === "Escape") {
              cancelRef.current = true;
              e.currentTarget.blur();
            }
          }}
          onBlur={(e) => commitRename(e.currentTarget.value)}
          className={CLASS.nameInput}
        />
      ) : (
        <span className={CLASS.name}>{label ?? node.name}</span>
      )}

      {!isEditing && (
        <div className={CLASS.actions}>
          <button
            title="New subfolder"
            onClick={(e) => {
              e.stopPropagation();
              void ctx.onNewFolder(node);
            }}
            className={CLASS.action}
          >
            +
          </button>
          {!isRoot && (
            <>
              <button
                title="Rename folder"
                onClick={(e) => {
                  e.stopPropagation();
                  ctx.setEditing(node.path);
                }}
                aria-label="Rename folder"
                className={CLASS.action}
              >
                ✎
              </button>
              <button
                title="Delete folder"
                aria-label="Delete folder"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete();
                }}
                className={`${CLASS.action} ${CLASS.actionDanger}`}
              >
                {"🗑"}
              </button>
            </>
          )}
          {node.count > 0 && <span className={CLASS.count}>{node.count}</span>}
        </div>
      )}
    </div>
  );
}
