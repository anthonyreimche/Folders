# Folders for Safelight

The Library **Folders** panel: the open project's folder tree.

- **Select:** click a folder to show its photos in the grid; click the
  project's name at the top to show the whole project. Folders with
  subfolders fold away behind the arrow beside them.
- **Open Folder:** the button under the tree opens another project folder.
- **New subfolder (+), Rename (✎) and Delete (🗑):** these show when the
  pointer is over a row. A new subfolder starts as "Untitled Folder", ready to
  be renamed; Enter or clicking away keeps the name, Escape cancels. Delete
  asks first: it removes the folder and everything in it from disk, and its
  photos from the catalogue.
- **Drag and drop:** drop photos from the grid onto a folder to move them
  there, or drag a folder onto another to move it inside.

Every change happens on disk. Ratings, edits and cached previews follow the
photos.

Until Safelight 3.2.0 this panel was built in. It keeps the built-in panel's
id (`core.folders`), so layouts saved before then keep it where it was.

## Development

```bash
npm install
npm run typecheck
npm run build    # dist/index.js, the file Safelight loads
npm test         # vitest; the bundle checks read dist/, so build first
npm run check    # all three, in that order
```

Safelight hands the extension its own React through `api.react`, so the
bundle never includes React. `src/safelight.d.ts` mirrors the part of the
app's extension API the extension uses.

## Licence

GPL-3.0-only with an attribution term (GPL v3 §7b), the same licence as Safelight; see LICENSE. Copyright (C) 2026 Anthony Reimche.
