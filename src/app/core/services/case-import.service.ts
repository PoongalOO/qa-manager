import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FolderService } from './folder.service';
import { CaseService } from './case.service';
import { Folder } from '../models/folder.model';
import { Case } from '../models/case.model';

export interface ImportResult {
  casesCreated: number;
  foldersCreated: number;
  skipped: number;
}

const CASE_FIELDS = [
  'state', 'priority', 'type', 'automationStatus', 'description', 'template', 'preConditions', 'expectedResults',
] as const;

// P1..P4 -> 0..3, matching PRIORITIES = ['Critique', 'Haute', 'Moyenne', 'Basse']
const PRIORITY_LABEL_RE = /^p([1-4])$/i;

@Injectable({ providedIn: 'root' })
export class CaseImportService {
  private folderSvc = inject(FolderService);
  private caseSvc = inject(CaseService);

  /** Imports test cases from an xlsx/csv/json file. Rows with a "folder" column are
   *  routed to that folder (created if missing; "/" separates nested subfolders),
   *  others go to defaultFolderId. Rows without a title are skipped. */
  async importFile(
    file: File,
    projectId: number,
    defaultFolderId: number,
    existingFolders: Folder[],
  ): Promise<ImportResult> {
    const rows = await this.parseFile(file);
    const folders = [...existingFolders];
    const folderCache = new Map<string, number>();
    let foldersCreated = 0;
    let casesCreated = 0;
    let skipped = 0;

    const resolveFolder = async (path: string): Promise<number> => {
      const segments = path.split('/').map(s => s.trim()).filter(Boolean);
      let parentId: number | null = null;
      let cumulativePath = '';
      for (const segment of segments) {
        cumulativePath = cumulativePath ? `${cumulativePath}/${segment}` : segment;
        let folderId = folderCache.get(cumulativePath);
        if (folderId === undefined) {
          let folder = folders.find(f =>
            f.parentFolderId === parentId && f.name.toLowerCase() === segment.toLowerCase(),
          );
          if (!folder) {
            folder = await firstValueFrom(this.folderSvc.createFolder(projectId, segment, '', parentId));
            folders.push(folder);
            foldersCreated++;
          }
          folderId = folder.id;
          folderCache.set(cumulativePath, folderId);
        }
        parentId = folderId;
      }
      return parentId ?? defaultFolderId;
    };

    for (const row of rows) {
      const title = this.str(row['title']);
      if (!title) { skipped++; continue; }

      const folderPath = this.str(row['folder']);
      const folderId = folderPath ? await resolveFolder(folderPath) : defaultFolderId;

      const data: Partial<Case> & { title: string } = { title };
      for (const field of CASE_FIELDS) {
        const value = row[field];
        if (value !== undefined && value !== null && value !== '') {
          (data as Record<string, unknown>)[field] = field === 'priority' ? this.parsePriority(value) : value;
        }
      }

      await firstValueFrom(this.caseSvc.createCase(folderId, data));
      casesCreated++;
    }

    return { casesCreated, foldersCreated, skipped };
  }

  private async parseFile(file: File): Promise<Record<string, unknown>[]> {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (ext === '.json') {
      const data = JSON.parse(await file.text());
      return Array.isArray(data) ? data : [];
    }
    const XLSX = await import('xlsx');
    if (ext === '.csv') {
      const wb = XLSX.read(await file.text(), { type: 'string' });
      return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    }
    const wb = XLSX.read(await file.arrayBuffer());
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  }

  private str(value: unknown): string {
    return value == null ? '' : String(value).trim();
  }

  private parsePriority(value: unknown): unknown {
    const text = this.str(value);
    const labelMatch = text.match(PRIORITY_LABEL_RE);
    if (labelMatch) return Number(labelMatch[1]) - 1;
    const numeric = Number(text);
    return Number.isFinite(numeric) && text !== '' ? numeric : value;
  }
}
