export interface Folder {
  id: number;
  name: string;
  detail: string | null;
  projectId: number;
  parentFolderId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderNode extends Folder {
  children: FolderNode[];
}

export function buildFolderTree(folders: Folder[]): FolderNode[] {
  const sorted = [...folders].sort((a, b) => naturalCompare(a.name, b.name));
  const map = new Map<number, FolderNode>();
  sorted.forEach(f => map.set(f.id, { ...f, children: [] }));
  const roots: FolderNode[] = [];
  sorted.forEach(f => {
    const node = map.get(f.id)!;
    if (f.parentFolderId == null) {
      roots.push(node);
    } else {
      const parent = map.get(f.parentFolderId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });
  return roots;
}

export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
