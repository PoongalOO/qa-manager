import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin, switchMap } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { FolderService } from '../../../core/services/folder.service';
import { CaseService } from '../../../core/services/case.service';
import { TagService } from '../../../core/services/tag.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { CaseExportService, ExportFormat } from '../../../core/services/case-export.service';
import { FolderNode, buildFolderTree, Folder } from '../../../core/models/folder.model';
import { CaseListItem, PRIORITIES, TEST_TYPES, PRIORITY_COLORS } from '../../../core/models/case.model';
import { Tag } from '../../../core/models/project.model';
import { ProjectNavComponent } from '../../../shared/components/project-nav/project-nav.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FolderDialogComponent, FolderDialogResult } from '../../../shared/components/folder-dialog/folder-dialog.component';

@Component({
  selector: 'app-folders-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatTreeModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatMenuModule, MatTooltipModule, MatChipsModule,
    ProjectNavComponent, TranslatePipe,
  ],
  template: `
    <div class="page-container anim-page">
      <app-project-nav [projectId]="projectId" />

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else {
        <div class="folders-layout">
          <!-- Folder tree pane -->
          <div class="folders-pane card-surface">
            <div class="pane-header">
              <span class="pane-title">{{ 'Folders.folders' | translate }}</span>
              @if (canEdit) {
                <button mat-icon-button matTooltip="Nouveau dossier racine" (click)="openCreateFolderDialog(null)">
                  <mat-icon>create_new_folder</mat-icon>
                </button>
              }
            </div>

            @if (treeData.data.length === 0) {
              <div class="empty-tree">Aucun dossier</div>
            } @else {
              <mat-tree [dataSource]="treeData" [treeControl]="treeControl" class="folder-tree">
                <!-- Leaf node -->
                <mat-tree-node *matTreeNodeDef="let node">
                  <div class="folder-node"
                       [class.selected]="node.id === selectedFolderId"
                       (click)="selectFolder(node)"
                       (dragover)="$event.preventDefault()"
                       (drop)="onFolderDrop($event, node.id)">
                    <button mat-icon-button disabled class="expand-btn"></button>
                    <mat-icon class="folder-icon">folder</mat-icon>
                    <span class="folder-name">{{ node.name }}</span>
                    @if (canEdit) {
                      <button mat-icon-button class="menu-btn" [matMenuTriggerFor]="folderMenu"
                              [matMenuTriggerData]="{node: node}" (click)="$event.stopPropagation()">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                    }
                  </div>
                </mat-tree-node>

                <!-- Parent node -->
                <mat-nested-tree-node *matTreeNodeDef="let node; when: hasChildren">
                  <div class="folder-node"
                       [class.selected]="node.id === selectedFolderId"
                       (click)="selectFolder(node)"
                       (dragover)="$event.preventDefault()"
                       (drop)="onFolderDrop($event, node.id)">
                    <button mat-icon-button matTreeNodeToggle (click)="$event.stopPropagation()" class="expand-btn">
                      <mat-icon>{{ treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}</mat-icon>
                    </button>
                    <mat-icon class="folder-icon">folder_open</mat-icon>
                    <span class="folder-name">{{ node.name }}</span>
                    @if (canEdit) {
                      <button mat-icon-button class="menu-btn" [matMenuTriggerFor]="folderMenu"
                              [matMenuTriggerData]="{node: node}" (click)="$event.stopPropagation()">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                    }
                  </div>
                  <ul [class.hidden]="!treeControl.isExpanded(node)">
                    <ng-container matTreeNodeOutlet></ng-container>
                  </ul>
                </mat-nested-tree-node>
              </mat-tree>
            }
          </div>

          <!-- Cases pane -->
          <div class="cases-pane">
            <!-- Filter bar -->
            <div class="filter-bar">
              <mat-form-field appearance="outline" class="search-field">
                <mat-icon matPrefix>search</mat-icon>
                <input matInput [(ngModel)]="searchFilter" (input)="onFilterChange()" placeholder="Rechercher..." />
              </mat-form-field>
              <mat-form-field appearance="outline" class="filter-select">
                <mat-label>Priorité</mat-label>
                <mat-select [(ngModel)]="priorityFilter" (ngModelChange)="onFilterChange()">
                  <mat-option [value]="null">Toutes</mat-option>
                  @for (p of priorities; track p; let i = $index) {
                    <mat-option [value]="i">{{ p }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="filter-select">
                <mat-label>Type</mat-label>
                <mat-select [(ngModel)]="typeFilter" (ngModelChange)="onFilterChange()">
                  <mat-option [value]="null">Tous</mat-option>
                  @for (t of types; track t; let i = $index) {
                    <mat-option [value]="i">{{ t }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              @if (projectTags.length > 0) {
                <mat-form-field appearance="outline" class="filter-select">
                  <mat-label>Tag</mat-label>
                  <mat-select [(ngModel)]="tagFilter" (ngModelChange)="onFilterChange()">
                    <mat-option [value]="null">Tous</mat-option>
                    @for (t of projectTags; track t.id) {
                      <mat-option [value]="t.id">{{ t.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }
            </div>

            <!-- Action bar -->
            <div class="action-bar">
              @if (canEdit && selectedFolderId) {
                <button mat-flat-button color="primary" (click)="openCreateCaseDialog()">
                  <mat-icon>add</mat-icon>
                  {{ 'Folders.new_test_case' | translate }}
                </button>
              }
              @if (selectedCaseIds.size > 0 && canEdit) {
                <button mat-stroked-button color="warn" (click)="onBulkDelete()">
                  <mat-icon>delete</mat-icon>
                  Supprimer ({{ selectedCaseIds.size }})
                </button>
              }
              <button mat-stroked-button [matMenuTriggerFor]="exportMenu" [disabled]="exporting"
                      matTooltip="Télécharger tous les cas de test du projet">
                @if (exporting) {
                  <mat-spinner diameter="16" class="export-spinner" />
                } @else {
                  <mat-icon>download</mat-icon>
                }
                Télécharger tous les cas
              </button>
            </div>

            @if (loadingCases) {
              <div class="spinner-center"><mat-spinner diameter="32" /></div>
            } @else if (!selectedFolderId) {
              <div class="empty-state">{{ 'Folders.select_folder' | translate }}</div>
            } @else {
              <table mat-table [dataSource]="casesDataSource" class="cases-table card-surface">
                <ng-container matColumnDef="select">
                  <th mat-header-cell *matHeaderCellDef>
                    <mat-checkbox (change)="toggleSelectAll($event.checked)"
                                  [checked]="allSelected"
                                  [indeterminate]="someSelected && !allSelected">
                    </mat-checkbox>
                  </th>
                  <td mat-cell *matCellDef="let row">
                    <mat-checkbox [checked]="selectedCaseIds.has(row.id)"
                                  (change)="toggleSelect(row.id)">
                    </mat-checkbox>
                  </td>
                </ng-container>

                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Folders.id' | translate }}</th>
                  <td mat-cell *matCellDef="let row"
                      draggable="true" (dragstart)="onCaseDragStart($event, row.id)">
                    {{ row.id }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Folders.title' | translate }}</th>
                  <td mat-cell *matCellDef="let row"
                      draggable="true" (dragstart)="onCaseDragStart($event, row.id)">
                    <a [routerLink]="['/projects', projectId, 'folders', selectedFolderId, 'cases', row.id]"
                       class="case-link">{{ row.title }}</a>
                  </td>
                </ng-container>

                <ng-container matColumnDef="priority">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Folders.priority' | translate }}</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="priority-badge" [style.background-color]="getPriorityColor(row.priority)">
                      {{ getPriorityLabel(row.priority) }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>{{ 'Folders.type' | translate }}</th>
                  <td mat-cell *matCellDef="let row">{{ getTypeLabel(row.type) }}</td>
                </ng-container>

                <ng-container matColumnDef="tags">
                  <th mat-header-cell *matHeaderCellDef>Tags</th>
                  <td mat-cell *matCellDef="let row">
                    @for (tag of row.tags; track tag.id) {
                      <span class="tag-chip">{{ tag.name }}</span>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                    {{ 'Folders.no_cases_found' | translate }}
                  </td>
                </tr>
              </table>
            }
          </div>
        </div>
      }
    </div>

    <!-- Folder context menu -->
    <mat-menu #folderMenu="matMenu">
      <ng-template matMenuContent let-node="node">
        <button mat-menu-item (click)="openCreateFolderDialog(node)">
          <mat-icon>create_new_folder</mat-icon>
          Sous-dossier
        </button>
        <button mat-menu-item (click)="openEditFolderDialog(node)">
          <mat-icon>edit</mat-icon>
          Modifier
        </button>
        <button mat-menu-item (click)="onDeleteFolder(node)">
          <mat-icon color="warn">delete</mat-icon>
          Supprimer
        </button>
      </ng-template>
    </mat-menu>

    <!-- Export format menu -->
    <mat-menu #exportMenu="matMenu">
      <button mat-menu-item (click)="exportAllCases('pdf')">
        <mat-icon>picture_as_pdf</mat-icon> PDF
      </button>
      <button mat-menu-item (click)="exportAllCases('xlsx')">
        <mat-icon>table_chart</mat-icon> Excel
      </button>
      <button mat-menu-item (click)="exportAllCases('json')">
        <mat-icon>data_object</mat-icon> JSON
      </button>
      <button mat-menu-item (click)="exportAllCases('txt')">
        <mat-icon>description</mat-icon> Texte
      </button>
      <button mat-menu-item (click)="exportAllCases('md')">
        <mat-icon>article</mat-icon> Markdown
      </button>
    </mat-menu>
  `,
  styles: [`
    .page-container { padding: 16px; }
    .folders-layout { display: flex; gap: 16px; margin-top: 16px; height: calc(100vh - 160px); }
    .folders-pane { width: 260px; min-width: 200px; overflow-y: auto; }
    .pane-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 8px 8px 14px; border-bottom: 1px solid var(--border); }
    .pane-title { font-weight: 600; font-size: 14px; }
    .empty-tree { padding: 16px; color: var(--text-secondary); font-size: 13px; }
    .folder-tree { padding: 4px 0; }
    .folder-node { display: flex; align-items: center; padding: 4px 6px; cursor: pointer; border-radius: var(--radius-sm); margin: 1px 6px; transition: background var(--transition-fast); }
    .folder-node:hover { background: var(--surface-muted); }
    .folder-node.selected { background: var(--brand-green-light); }
    .folder-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 6px; color: var(--brand-navy); }
    .folder-node.selected .folder-icon { color: var(--brand-green-dark); }
    .folder-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .expand-btn { width: 28px; height: 28px; flex-shrink: 0; }
    .menu-btn { width: 28px; height: 28px; opacity: 0; flex-shrink: 0; }
    .folder-node:hover .menu-btn { opacity: 1; }
    .hidden { display: none; }
    ul { list-style: none; padding: 0 0 0 12px; margin: 0; }
    li { list-style: none; }
    mat-tree-node, mat-nested-tree-node { display: block; }

    .cases-pane { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: 14px; }
    .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-start; }
    .search-field { flex: 1; min-width: 200px; }
    .filter-select { width: 140px; }
    .action-bar { display: flex; gap: 8px; align-items: center; }
    .export-spinner { display: inline-block; margin-right: 8px; vertical-align: middle; }
    .cases-table { width: 100%; }
    .cases-table tr.mat-mdc-row:hover { background: var(--surface-muted); }
    .empty-state { text-align: center; padding: 32px; color: var(--text-secondary); }
    .spinner-center { display: flex; justify-content: center; padding: 32px; }
    .case-link { color: var(--text-primary); font-weight: 500; text-decoration: none; transition: color var(--transition-fast); }
    .case-link:hover { color: var(--brand-green-dark); }
    .priority-badge { padding: 2px 10px; border-radius: 12px; color: white; font-size: 11px; font-weight: 600; }
    .tag-chip { background: var(--brand-green-light); color: var(--brand-green-dark); padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 4px; }
    mat-form-field { font-size: 13px; }
  `],
})
export class FoldersListComponent implements OnInit, OnChanges {
  @Input() projectId!: string;
  @Input() folderId?: string;

  private folderSvc = inject(FolderService);
  private caseSvc = inject(CaseService);
  private tagSvc = inject(TagService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private projectSvc = inject(ProjectService);
  private exportSvc = inject(CaseExportService);

  loading = true;
  loadingCases = false;
  exporting = false;
  folders: Folder[] = [];
  projectTags: Tag[] = [];
  cases: CaseListItem[] = [];
  selectedFolderId: number | null = null;
  selectedCaseIds = new Set<number>();
  draggedCaseIds: number[] = [];

  priorities = PRIORITIES;
  types = TEST_TYPES;
  searchFilter = '';
  priorityFilter: number | null = null;
  typeFilter: number | null = null;
  tagFilter: number | null = null;

  displayedColumns = ['select', 'id', 'title', 'priority', 'type', 'tags'];
  casesDataSource = new MatTableDataSource<CaseListItem>();

  treeControl = new NestedTreeControl<FolderNode>(node => node.children);
  treeData = new MatTreeNestedDataSource<FolderNode>();

  hasChildren = (_: number, node: FolderNode) => node.children.length > 0;

  get canEdit(): boolean {
    const pid = parseInt(this.projectId, 10);
    return this.auth.isProjectManager(pid) || this.auth.isProjectDeveloper(pid);
  }

  get allSelected(): boolean {
    return this.cases.length > 0 && this.selectedCaseIds.size === this.cases.length;
  }

  get someSelected(): boolean {
    return this.selectedCaseIds.size > 0;
  }

  ngOnInit(): void {
    this.loadFolders();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['folderId'] && !changes['folderId'].firstChange) {
      const newFolderId = changes['folderId'].currentValue;
      if (newFolderId) {
        this.selectedFolderId = parseInt(newFolderId, 10);
        this.loadCases();
      }
    }
  }

  loadFolders(): void {
    const pid = parseInt(this.projectId, 10);
    this.loading = true;
    forkJoin([
      this.folderSvc.getFolders(pid),
      this.tagSvc.getTags(pid),
    ]).subscribe({
      next: ([folders, tags]) => {
        this.folders = folders;
        this.projectTags = tags;
        this.treeData.data = buildFolderTree(folders);
        this.treeControl.dataNodes = this.treeData.data;
        this.treeControl.expandAll();

        if (this.folderId) {
          this.selectedFolderId = parseInt(this.folderId, 10);
          this.loadCases();
        } else if (folders.length > 0) {
          const smallest = folders.reduce((a, b) => a.id < b.id ? a : b);
          this.router.navigate(['/projects', this.projectId, 'folders', smallest.id, 'cases'], { replaceUrl: true });
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadCases(): void {
    if (!this.selectedFolderId) return;
    this.loadingCases = true;
    this.selectedCaseIds.clear();
    this.caseSvc.getCases(this.selectedFolderId, {
      search: this.searchFilter || undefined,
      priority: this.priorityFilter,
      type: this.typeFilter,
      tag: this.tagFilter,
    }).subscribe({
      next: (cases) => {
        this.cases = cases;
        this.casesDataSource.data = cases;
        this.loadingCases = false;
      },
      error: () => { this.loadingCases = false; },
    });
  }

  selectFolder(node: FolderNode): void {
    if (node.id === this.selectedFolderId) return;
    this.router.navigate(['/projects', this.projectId, 'folders', node.id, 'cases']);
  }

  onFilterChange(): void {
    this.loadCases();
  }

  toggleSelect(caseId: number): void {
    if (this.selectedCaseIds.has(caseId)) {
      this.selectedCaseIds.delete(caseId);
    } else {
      this.selectedCaseIds.add(caseId);
    }
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.cases.forEach(c => this.selectedCaseIds.add(c.id));
    } else {
      this.selectedCaseIds.clear();
    }
  }

  onCaseDragStart(event: DragEvent, caseId: number): void {
    if (this.selectedCaseIds.size > 0 && this.selectedCaseIds.has(caseId)) {
      this.draggedCaseIds = Array.from(this.selectedCaseIds);
    } else {
      this.draggedCaseIds = [caseId];
    }
    event.dataTransfer?.setData('text/plain', JSON.stringify(this.draggedCaseIds));
  }

  onFolderDrop(event: DragEvent, targetFolderId: number): void {
    event.preventDefault();
    if (this.draggedCaseIds.length === 0) return;
    if (targetFolderId === this.selectedFolderId) return;
    const pid = parseInt(this.projectId, 10);
    this.caseSvc.moveCases(pid, this.draggedCaseIds, targetFolderId).subscribe({
      next: () => {
        this.snackBar.open('Cas déplacés', 'OK', { duration: 2000 });
        this.draggedCaseIds = [];
        this.selectedCaseIds.clear();
        this.loadCases();
      },
      error: () => { this.snackBar.open('Erreur lors du déplacement', 'Fermer', { duration: 3000 }); },
    });
  }

  openCreateFolderDialog(parentNode: FolderNode | null): void {
    const pid = parseInt(this.projectId, 10);
    const dialogRef = this.dialog.open(FolderDialogComponent, {
      width: '420px',
      data: { folder: null, parentFolderId: parentNode?.id ?? null },
    });
    dialogRef.afterClosed().subscribe((result: FolderDialogResult | undefined) => {
      if (!result) return;
      this.folderSvc.createFolder(pid, result.name, result.detail, result.parentFolderId).subscribe({
        next: () => { this.snackBar.open('Dossier créé', 'OK', { duration: 2000 }); this.loadFolders(); },
        error: () => { this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 }); },
      });
    });
  }

  openEditFolderDialog(node: FolderNode): void {
    const pid = parseInt(this.projectId, 10);
    const dialogRef = this.dialog.open(FolderDialogComponent, {
      width: '420px',
      data: { folder: node, parentFolderId: node.parentFolderId },
    });
    dialogRef.afterClosed().subscribe((result: FolderDialogResult | undefined) => {
      if (!result) return;
      this.folderSvc.updateFolder(node.id, result.name, result.detail, pid, result.parentFolderId).subscribe({
        next: () => { this.snackBar.open('Dossier modifié', 'OK', { duration: 2000 }); this.loadFolders(); },
        error: () => { this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 }); },
      });
    });
  }

  onDeleteFolder(node: FolderNode): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer le dossier',
        message: `Voulez-vous vraiment supprimer "${node.name}" ?`,
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
      },
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.folderSvc.deleteFolder(node.id).subscribe({
        next: () => {
          this.snackBar.open('Dossier supprimé', 'OK', { duration: 2000 });
          if (this.selectedFolderId === node.id) {
            this.selectedFolderId = null;
            this.cases = [];
            this.casesDataSource.data = [];
          }
          this.loadFolders();
        },
        error: () => { this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 }); },
      });
    });
  }

  openCreateCaseDialog(): void {
    if (!this.selectedFolderId) return;
    const fid = this.selectedFolderId;
    const title = window.prompt('Titre du cas de test', 'Untitled Case');
    if (title == null) return;
    if (!title.trim()) { this.snackBar.open('Le titre est requis', 'OK', { duration: 2000 }); return; }
    this.caseSvc.createCase(fid, { title: title.trim() }).subscribe({
      next: (newCase) => {
        this.snackBar.open('Cas créé', 'OK', { duration: 2000 });
        this.router.navigate(['/projects', this.projectId, 'folders', this.selectedFolderId, 'cases', newCase.id]);
      },
      error: () => { this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 }); },
    });
  }

  onBulkDelete(): void {
    const ids = Array.from(this.selectedCaseIds);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer les cas',
        message: `Voulez-vous vraiment supprimer ${ids.length} cas de test ?`,
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
      },
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.caseSvc.bulkDeleteCases(ids).subscribe({
        next: () => {
          this.snackBar.open('Cas supprimés', 'OK', { duration: 2000 });
          this.selectedCaseIds.clear();
          this.loadCases();
        },
        error: () => { this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 }); },
      });
    });
  }

  exportAllCases(format: ExportFormat): void {
    if (this.exporting) return;
    if (this.folders.length === 0) {
      this.snackBar.open('Aucun cas de test à exporter', 'OK', { duration: 2500 });
      return;
    }
    this.exporting = true;
    const pid = parseInt(this.projectId, 10);
    this.projectSvc.getProjectInfo(pid).pipe(
      switchMap(project => this.exportSvc.exportProjectCases(pid, project.name, this.folders, format)),
    ).subscribe({
      next: (count) => {
        this.exporting = false;
        this.snackBar.open(
          count > 0 ? `${count} cas de test exportés` : 'Aucun cas de test à exporter',
          'OK', { duration: 2500 },
        );
      },
      error: () => {
        this.exporting = false;
        this.snackBar.open('Erreur lors de la génération du fichier', 'Fermer', { duration: 3000 });
      },
    });
  }

  getPriorityLabel(index: number): string {
    return PRIORITIES[index] ?? String(index);
  }

  getPriorityColor(index: number): string {
    return PRIORITY_COLORS[index] ?? '#ccc';
  }

  getTypeLabel(index: number): string {
    return TEST_TYPES[index] ?? String(index);
  }
}
