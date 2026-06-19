import { Injectable, inject } from '@angular/core';
import { Observable, from, of, switchMap } from 'rxjs';
import { CaseService } from './case.service';
import { ExportCase, ExportCaseStep, PRIORITIES, TEST_TYPES, CASE_STATES, AUTOMATION_STATUSES } from '../models/case.model';
import { Folder, FolderNode, buildFolderTree } from '../models/folder.model';

export type ExportFormat = 'pdf' | 'xlsx' | 'json' | 'txt' | 'md';

interface FolderGroup {
  folderPath: string;
  cases: ExportCase[];
}

@Injectable({ providedIn: 'root' })
export class CaseExportService {
  private caseSvc = inject(CaseService);

  /** Exports every test case of the project, ordered by folder hierarchy then case id. Returns the number of cases exported. */
  exportProjectCases(
    projectId: number,
    projectName: string,
    folders: Folder[],
    format: ExportFormat,
  ): Observable<number> {
    return this.caseSvc.getCasesByProject(projectId).pipe(
      switchMap(list => {
        if (list.length === 0) return of(0);
        return this.caseSvc.downloadCasesData(list.map(c => c.id)).pipe(
          switchMap(fullCases => {
            const groups = this.groupAndOrder(fullCases, folders);
            return from(this.generateFile(groups, projectName, format)).pipe(
              switchMap(() => of(fullCases.length)),
            );
          }),
        );
      }),
    );
  }

  private groupAndOrder(cases: ExportCase[], folders: Folder[]): FolderGroup[] {
    const byFolder = new Map<number, ExportCase[]>();
    for (const c of cases) {
      const arr = byFolder.get(c.folderId) ?? [];
      arr.push(c);
      byFolder.set(c.folderId, arr);
    }
    const groups: FolderGroup[] = [];
    for (const { folder, path } of this.flattenFolderOrder(folders)) {
      const folderCases = (byFolder.get(folder.id) ?? []).slice().sort((a, b) => a.id - b.id);
      if (folderCases.length > 0) groups.push({ folderPath: path, cases: folderCases });
    }
    return groups;
  }

  private flattenFolderOrder(folders: Folder[]): { folder: Folder; path: string }[] {
    const tree = buildFolderTree(folders);
    const result: { folder: Folder; path: string }[] = [];
    const walk = (nodes: FolderNode[], parentPath: string) => {
      for (const node of nodes) {
        const path = parentPath ? `${parentPath} / ${node.name}` : node.name;
        result.push({ folder: node, path });
        walk(node.children, path);
      }
    };
    walk(tree, '');
    return result;
  }

  private orderedSteps(c: ExportCase): ExportCaseStep[] {
    return (c.steps ?? []).slice().sort((a, b) => a.stepNo - b.stepNo);
  }

  private async generateFile(groups: FolderGroup[], projectName: string, format: ExportFormat): Promise<void> {
    const filenameBase = `cas-de-test_${this.slugify(projectName)}_${this.dateStamp()}`;
    switch (format) {
      case 'json':
        this.downloadBlob(this.toJson(groups, projectName), `${filenameBase}.json`, 'application/json');
        break;
      case 'txt':
        this.downloadBlob(this.toText(groups, projectName), `${filenameBase}.txt`, 'text/plain');
        break;
      case 'md':
        this.downloadBlob(this.toMarkdown(groups, projectName), `${filenameBase}.md`, 'text/markdown');
        break;
      case 'xlsx':
        await this.toExcel(groups, filenameBase);
        break;
      case 'pdf':
        await this.toPdf(groups, projectName, filenameBase);
        break;
    }
  }

  // ---------- JSON ----------
  private toJson(groups: FolderGroup[], projectName: string): string {
    const payload = {
      project: projectName,
      generatedAt: new Date().toISOString(),
      folders: groups.map(g => ({
        folder: g.folderPath,
        cases: g.cases.map(c => ({
          id: c.id,
          title: c.title,
          priority: PRIORITIES[c.priority] ?? c.priority,
          type: TEST_TYPES[c.type] ?? c.type,
          state: CASE_STATES[c.state] ?? c.state,
          automationStatus: AUTOMATION_STATUSES[c.automationStatus] ?? c.automationStatus,
          tags: (c.tags ?? []).map(t => t.name),
          preConditions: c.preConditions ?? '',
          description: c.description ?? '',
          steps: this.orderedSteps(c).map((s, i) => ({
            stepNo: i + 1,
            action: s.step ?? '',
            expectedResult: s.result ?? '',
          })),
          expectedResults: c.expectedResults ?? '',
        })),
      })),
    };
    return JSON.stringify(payload, null, 2);
  }

  // ---------- Text ----------
  private toText(groups: FolderGroup[], projectName: string): string {
    const lines: string[] = [];
    lines.push(`CAS DE TEST - ${projectName}`);
    lines.push(`Genere le ${new Date().toLocaleString('fr-FR')}`);
    lines.push('');
    for (const g of groups) {
      lines.push('='.repeat(70));
      lines.push(`DOSSIER : ${g.folderPath}`);
      lines.push('='.repeat(70));
      lines.push('');
      for (const c of g.cases) {
        lines.push('-'.repeat(70));
        lines.push(`[#${c.id}] ${c.title}`);
        lines.push('-'.repeat(70));
        lines.push(`Priorite : ${PRIORITIES[c.priority] ?? c.priority}    Type : ${TEST_TYPES[c.type] ?? c.type}    Statut : ${CASE_STATES[c.state] ?? c.state}`);
        if (c.tags?.length) lines.push(`Tags : ${c.tags.map(t => t.name).join(', ')}`);
        lines.push('');
        if (c.preConditions) { lines.push('Preconditions :'); lines.push(c.preConditions); lines.push(''); }
        if (c.description) { lines.push('Description :'); lines.push(c.description); lines.push(''); }
        const steps = this.orderedSteps(c);
        if (steps.length) {
          lines.push('Etapes :');
          steps.forEach((s, i) => {
            lines.push(`  ${i + 1}. ${s.step ?? ''}`);
            lines.push(`     Resultat attendu : ${s.result ?? ''}`);
            lines.push('     Resultat obtenu   : ____________________   [ ] OK   [ ] KO');
          });
          lines.push('');
        }
        if (c.expectedResults) { lines.push('Resultat attendu global :'); lines.push(c.expectedResults); lines.push(''); }
        lines.push('');
      }
    }
    return lines.join('\n');
  }

  // ---------- Markdown ----------
  private toMarkdown(groups: FolderGroup[], projectName: string): string {
    const lines: string[] = [];
    lines.push(`# Cas de test — ${projectName}`);
    lines.push(`_Généré le ${new Date().toLocaleString('fr-FR')}_`);
    lines.push('');
    for (const g of groups) {
      lines.push(`## ${g.folderPath}`);
      lines.push('');
      for (const c of g.cases) {
        lines.push(`### #${c.id} — ${c.title}`);
        lines.push('');
        lines.push('| Priorité | Type | Statut | Tags |');
        lines.push('|---|---|---|---|');
        lines.push(`| ${PRIORITIES[c.priority] ?? c.priority} | ${TEST_TYPES[c.type] ?? c.type} | ${CASE_STATES[c.state] ?? c.state} | ${(c.tags ?? []).map(t => t.name).join(', ') || '—'} |`);
        lines.push('');
        if (c.preConditions) { lines.push('**Préconditions**', '', c.preConditions, ''); }
        if (c.description) { lines.push('**Description**', '', c.description, ''); }
        const steps = this.orderedSteps(c);
        if (steps.length) {
          lines.push('**Étapes**', '');
          lines.push('| # | Action | Résultat attendu | Résultat obtenu |');
          lines.push('|---|---|---|---|');
          steps.forEach((s, i) => {
            lines.push(`| ${i + 1} | ${this.escapeMd(s.step)} | ${this.escapeMd(s.result)} | ☐ OK ☐ KO |`);
          });
          lines.push('');
        }
        if (c.expectedResults) { lines.push('**Résultat attendu global**', '', c.expectedResults, ''); }
        lines.push('---', '');
      }
    }
    return lines.join('\n');
  }

  private escapeMd(text?: string | null): string {
    return (text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
  }

  // ---------- Excel ----------
  private async toExcel(groups: FolderGroup[], filenameBase: string): Promise<void> {
    const XLSX = await import('xlsx');
    const rows = groups.flatMap(g => g.cases.map(c => ({
      'Dossier': g.folderPath,
      'ID': c.id,
      'Titre': c.title,
      'Priorité': PRIORITIES[c.priority] ?? c.priority,
      'Type': TEST_TYPES[c.type] ?? c.type,
      'Statut': CASE_STATES[c.state] ?? c.state,
      'Tags': (c.tags ?? []).map(t => t.name).join(', '),
      'Préconditions': c.preConditions ?? '',
      'Description': c.description ?? '',
      'Étapes': this.orderedSteps(c).map((s, i) => `${i + 1}. ${s.step ?? ''}\n   -> ${s.result ?? ''}`).join('\n'),
      'Résultat attendu global': c.expectedResults ?? '',
      'Résultat obtenu': '',
      'Commentaire': '',
    })));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 22 }, { wch: 6 }, { wch: 32 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 18 }, { wch: 28 }, { wch: 28 }, { wch: 45 }, { wch: 28 }, { wch: 16 }, { wch: 24 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cas de test');
    XLSX.writeFile(wb, `${filenameBase}.xlsx`);
  }

  // ---------- PDF ----------
  private async toPdf(groups: FolderGroup[], projectName: string, filenameBase: string): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    doc.setFontSize(18);
    doc.text(`Cas de test - ${projectName}`, margin, y);
    y += 22;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Genere le ${new Date().toLocaleString('fr-FR')}`, margin, y);
    doc.setTextColor(0);
    y += 24;

    const writeWrapped = (label: string, text: string) => {
      ensureSpace(24);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, y);
      y += 12;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(text, contentWidth) as string[];
      for (const line of lines) {
        ensureSpace(11);
        doc.text(line, margin, y);
        y += 11;
      }
      y += 6;
    };

    for (const group of groups) {
      ensureSpace(26);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(group.folderPath, margin, y);
      doc.setFont('helvetica', 'normal');
      y += 18;

      for (const c of group.cases) {
        ensureSpace(30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`#${c.id} - ${c.title}`, margin, y);
        doc.setFont('helvetica', 'normal');
        y += 14;

        doc.setFontSize(9);
        doc.text(
          `Priorite: ${PRIORITIES[c.priority] ?? c.priority}    Type: ${TEST_TYPES[c.type] ?? c.type}    Statut: ${CASE_STATES[c.state] ?? c.state}`,
          margin, y,
        );
        y += 12;
        if (c.tags?.length) {
          doc.text(`Tags: ${c.tags.map(t => t.name).join(', ')}`, margin, y);
          y += 12;
        }
        y += 4;

        if (c.preConditions) writeWrapped('Preconditions :', c.preConditions);
        if (c.description) writeWrapped('Description :', c.description);

        const steps = this.orderedSteps(c);
        if (steps.length) {
          ensureSpace(20);
          autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['#', 'Action', 'Resultat attendu', 'Resultat obtenu']],
            body: steps.map((s, i) => [String(i + 1), s.step ?? '', s.result ?? '', '']),
            styles: { fontSize: 8, cellPadding: 4, valign: 'top' },
            headStyles: { fillColor: [25, 90, 64] },
            columnStyles: { 0: { cellWidth: 18 }, 3: { cellWidth: 90 } },
          });
          y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
        }

        if (c.expectedResults) writeWrapped('Resultat attendu global :', c.expectedResults);

        ensureSpace(14);
        doc.setDrawColor(220);
        doc.line(margin, y, pageWidth - margin, y);
        y += 16;
      }
    }

    doc.save(`${filenameBase}.pdf`);
  }

  // ---------- Helpers ----------
  private downloadBlob(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private slugify(text: string): string {
    return text
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'projet';
  }

  private dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
