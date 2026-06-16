import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { RunService } from '../../../core/services/run.service';
import { FolderService } from '../../../core/services/folder.service';
import { CaseService } from '../../../core/services/case.service';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Run, RunCase, RunCaseResult, CaseWithRunCase, RUN_STATES, RUN_CASE_STATUSES, RUN_CASE_STATUS_COLORS } from '../../../core/models/run.model';
import { Case, PRIORITIES, PRIORITY_COLORS, TEST_TYPES } from '../../../core/models/case.model';
import { Comment } from '../../../core/models/comment.model';
import { FolderNode, buildFolderTree, Folder } from '../../../core/models/folder.model';
import { ProjectNavComponent } from '../../../shared/components/project-nav/project-nav.component';
import { CanDeactivateComponent } from '../../../core/guards/unsaved-changes.guard';

@Component({
  selector: 'app-run-editor',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterModule, ReactiveFormsModule, FormsModule,
    MatTreeModule, MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatProgressSpinnerModule, MatTooltipModule,
    ProjectNavComponent, TranslatePipe,
  ],
  template: `
    <div class="page-container">
      <app-project-nav [projectId]="projectId" />

      @if (loading) {
        <mat-spinner diameter="40" />
      } @else if (run) {
        <!-- Header -->
        <div class="run-header">
          <a [routerLink]="['/projects', projectId, 'runs']" class="back-link">
            <mat-icon>arrow_back</mat-icon> {{ 'Run.back_to_runs' | translate }}
          </a>
          <div class="header-actions">
            @if (canManage) {
              <button mat-stroked-button [color]="configMode ? 'primary' : undefined"
                      (click)="toggleConfigMode()">
                <mat-icon>{{ configMode ? 'play_circle_outline' : 'playlist_add_check' }}</mat-icon>
                {{ (configMode ? 'Run.exec_mode' : 'Run.config_cases') | translate }}
              </button>
            }
            <button mat-flat-button color="primary" (click)="onSave()" [disabled]="saving || !isDirty">
              @if (!saving) { <mat-icon>save</mat-icon> }
              <span>{{ saving ? ('Run.updating' | translate) : ('Run.update' | translate) }}</span>
            </button>
          </div>
        </div>

        <!-- Run info card -->
        <mat-card class="run-info-card">
          <mat-card-content>
            <form [formGroup]="form" class="run-form">
              <mat-form-field appearance="outline" class="run-name-field">
                <mat-label>Nom de la campagne</mat-label>
                <input matInput formControlName="name" (input)="markDirty()" [readonly]="!canManage" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>État</mat-label>
                <mat-select formControlName="state" (selectionChange)="markDirty()" [disabled]="!canManage">
                  @for (s of runStates; track s; let i = $index) {
                    <mat-option [value]="i">{{ s }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="run-desc-field">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="2" (input)="markDirty()" [readonly]="!canManage"></textarea>
              </mat-form-field>
            </form>

            @if (totalIncluded > 0) {
              <div class="status-chips-row">
                <div class="status-chips">
                  @for (s of runCaseStatuses; track s; let i = $index) {
                    <span class="status-chip" [style.background-color]="runCaseStatusColors[i]">
                      {{ s }}: {{ getMyStatusCount(i) }}
                    </span>
                  }
                  <span class="status-chip total-chip">Total: {{ totalIncluded }}</span>
                </div>
                @if (canManage && viewTesterUserId !== null) {
                  <div class="viewing-as-chip">
                    <mat-icon class="eye-icon">visibility</mat-icon>
                    <span>{{ viewTesterUsername }}</span>
                    <button mat-icon-button class="clear-view-btn" (click)="clearTesterView()"
                            [matTooltip]="'Run.my_results' | translate">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
              </div>

              @if (canManage && testerStats.length > 0) {
                <div class="tester-stats">
                  <p class="tester-stats-title">{{ 'Run.results_by_tester' | translate }}</p>
                  <div class="tester-table-wrap">
                    <table class="tester-table">
                      <thead>
                        <tr>
                          <th class="col-tester">{{ 'Run.tester' | translate }}</th>
                          @for (s of runCaseStatuses; track s; let i = $index) {
                            <th class="col-status" [style.color]="runCaseStatusColors[i]">{{ s }}</th>
                          }
                          <th class="col-total">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (ts of testerStats; track ts.userId) {
                          <tr class="tester-row-clickable"
                              [class.tester-row-active]="viewTesterUserId === ts.userId"
                              (click)="selectTesterView(ts.userId, ts.username)">
                            <td class="col-tester">
                              <mat-icon class="tester-eye-icon" *ngIf="viewTesterUserId === ts.userId">visibility</mat-icon>
                              {{ ts.username }}
                            </td>
                            @for (count of ts.counts; track $index; let i = $index) {
                              <td class="col-status" [style.font-weight]="count > 0 ? 600 : 400"
                                  [style.color]="count > 0 ? runCaseStatusColors[i] : '#bbb'">{{ count }}</td>
                            }
                            <td class="col-total">{{ ts.total }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <p class="tester-table-hint">{{ 'Run.click_tester_hint' | translate }}</p>
                </div>
              }
            }
          </mat-card-content>
        </mat-card>

        <!-- Main split pane -->
        <div class="editor-layout">
          <!-- Folder tree -->
          <div class="folders-pane mat-elevation-z1">
            <div class="pane-header"><span class="pane-title">Dossiers</span></div>
            @if (treeData.data.length === 0) {
              <div class="empty-tree">Aucun dossier</div>
            } @else {
              <mat-tree [dataSource]="treeData" [treeControl]="treeControl" class="folder-tree">
                <mat-tree-node *matTreeNodeDef="let node">
                  <div class="folder-node" [class.selected]="node.id === selectedFolderId" (click)="selectFolder(node)">
                    <button mat-icon-button disabled class="expand-btn"></button>
                    <mat-icon class="folder-icon">folder</mat-icon>
                    <span class="folder-name">{{ node.name }}</span>
                    @if (getFolderIncludedCount(node.id) > 0) {
                      <span class="folder-badge">{{ getFolderIncludedCount(node.id) }}</span>
                    }
                  </div>
                </mat-tree-node>
                <mat-nested-tree-node *matTreeNodeDef="let node; when: hasChildren">
                  <div class="folder-node" [class.selected]="node.id === selectedFolderId" (click)="selectFolder(node)">
                    <button mat-icon-button matTreeNodeToggle (click)="$event.stopPropagation()" class="expand-btn">
                      <mat-icon>{{ treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}</mat-icon>
                    </button>
                    <mat-icon class="folder-icon">folder_open</mat-icon>
                    <span class="folder-name">{{ node.name }}</span>
                    @if (getFolderIncludedCount(node.id) > 0) {
                      <span class="folder-badge">{{ getFolderIncludedCount(node.id) }}</span>
                    }
                  </div>
                  <ul [class.hidden]="!treeControl.isExpanded(node)">
                    <ng-container matTreeNodeOutlet></ng-container>
                  </ul>
                </mat-nested-tree-node>
              </mat-tree>
            }
          </div>

          <!-- Cases table -->
          <div class="cases-pane">
            @if (!selectedFolderId && !configMode) {
              <div class="empty-state">{{ 'Folders.select_folder' | translate }}</div>
            } @else if (!selectedFolderId && configMode && folders.length === 0) {
              <div class="empty-state">{{ 'Run.no_folders_in_project' | translate }}</div>
            } @else if (filteredCases.length === 0 && !configMode) {
              <div class="empty-state">Aucun cas dans ce dossier</div>
            } @else if (filteredCases.length === 0 && configMode) {
              <div class="empty-state">{{ 'Run.no_cases_in_folder' | translate }}</div>
            } @else {
              @if (configMode) {
                <div class="config-banner">
                  <mat-icon class="config-icon">playlist_add_check</mat-icon>
                  <span>{{ 'Run.config_hint' | translate }}</span>
                </div>
              }
              @if (!configMode && canManage && isViewingOtherTester) {
                <div class="tester-view-banner">
                  <mat-icon>visibility</mat-icon>
                  <span>{{ 'Run.viewing_tester' | translate }} : <strong>{{ viewTesterUsername }}</strong></span>
                  <button mat-button color="primary" (click)="clearTesterView()">
                    <mat-icon>person</mat-icon> {{ 'Run.my_results' | translate }}
                  </button>
                </div>
              }
              <table mat-table [dataSource]="casesDataSource" class="cases-table mat-elevation-z1">

                <ng-container matColumnDef="select">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button class="inclusion-btn"
                            (click)="toggleInclusion(row); $event.stopPropagation()"
                            [matTooltip]="(isIncluded(row) ? 'Run.exclude_from_run' : 'Run.include_in_run') | translate">
                      <mat-icon [class.included-icon]="isIncluded(row)" [class.excluded-icon]="!isIncluded(row)">
                        {{ isIncluded(row) ? 'check_circle' : 'radio_button_unchecked' }}
                      </mat-icon>
                    </button>
                  </td>
                </ng-container>

                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>ID</th>
                  <td mat-cell *matCellDef="let row">{{ row.id }}</td>
                </ng-container>

                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Titre</th>
                  <td mat-cell *matCellDef="let row">
                    <div class="title-cell">
                      <button class="case-title-btn"
                              [class.active]="row.id === selectedCaseId"
                              (click)="openCaseDetail(row.id)">{{ row.title }}</button>
                      @if (!configMode && +(row.RunCases[0]?.commentCount ?? 0) > 0) {
                        <span class="comment-badge"
                              [matTooltip]="(row.RunCases[0]?.commentCount) + ' commentaire(s)'">
                          <mat-icon class="comment-badge-icon">chat_bubble_outline</mat-icon>
                          {{ row.RunCases[0]?.commentCount }}
                        </span>
                      }
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="priority">
                  <th mat-header-cell *matHeaderCellDef>Priorité</th>
                  <td mat-cell *matCellDef="let row">{{ getPriorityLabel(row.priority) }}</td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Statut</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-select [value]="getRunCaseStatus(row)"
                                (selectionChange)="changeStatus(row, $event.value)"
                                class="status-select"
                                [disabled]="isViewingOtherTester"
                                [matTooltip]="isViewingOtherTester ? (('Run.viewing_tester' | translate) + ' : ' + viewTesterUsername) : ''">
                      @for (s of runCaseStatuses; track s; let i = $index) {
                        <mat-option [value]="i">{{ s }}</mat-option>
                      }
                    </mat-select>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                    [class.row-selected]="row.id === selectedCaseId"
                    [class.row-not-included]="configMode && !isIncluded(row)"></tr>
              </table>
            }
          </div>

          <!-- Detail panel -->
          @if (selectedCaseId !== null) {
            <div class="detail-panel mat-elevation-z2">
              <div class="detail-tabs">
                <button class="tab-btn" [class.active]="activeDetailTab === 'detail'"
                        (click)="setDetailTab('detail')">
                  {{ 'Run.test_detail' | translate }}
                </button>
                <button class="tab-btn" [class.active]="activeDetailTab === 'comments'"
                        (click)="setDetailTab('comments')">
                  {{ 'Run.comments' | translate }}
                </button>
                <button class="tab-btn" [class.active]="activeDetailTab === 'history'"
                        (click)="setDetailTab('history')">
                  {{ 'Run.history' | translate }}
                </button>
              </div>

              <!-- Test case detail tab -->
              @if (activeDetailTab === 'detail') {
                @if (caseDetailLoading) {
                  <div class="detail-loading"><mat-spinner diameter="28" /></div>
                } @else if (selectedCaseDetail) {
                  <div class="detail-content">
                    <p class="detail-title">#{{ selectedCaseDetail.id }} {{ selectedCaseDetail.title }}</p>

                    @if (selectedCaseDetail.description) {
                      <div class="detail-section">
                        <h4 class="detail-label">{{ 'Run.description' | translate }}</h4>
                        <p class="detail-text">{{ selectedCaseDetail.description }}</p>
                      </div>
                    }

                    <div class="detail-section">
                      <h4 class="detail-label">{{ 'Run.priority' | translate }}</h4>
                      <div class="priority-row">
                        <span class="priority-dot"
                              [style.background-color]="getPriorityColor(selectedCaseDetail.priority)"></span>
                        <span class="detail-text">{{ getPriorityLabel(selectedCaseDetail.priority) }}</span>
                      </div>
                    </div>

                    <div class="detail-section">
                      <h4 class="detail-label">{{ 'Run.type' | translate }}</h4>
                      <p class="detail-text">{{ getTypeLabel(selectedCaseDetail.type) }}</p>
                    </div>

                    <div class="detail-section">
                      <h4 class="detail-label">Tags</h4>
                      @if (selectedCaseDetail.Tags && selectedCaseDetail.Tags.length > 0) {
                        <div class="tags-row">
                          @for (tag of selectedCaseDetail.Tags; track tag.id) {
                            <span class="tag-chip">{{ tag.name }}</span>
                          }
                        </div>
                      }
                    </div>

                    @if (selectedCaseDetail.template === 1 && sortedDetailSteps.length > 0) {
                      <div class="detail-section">
                        <h4 class="detail-label">{{ 'Run.steps' | translate }}</h4>
                        <div class="steps-grid">
                          <div class="steps-header-cell">{{ 'Run.details_of_step' | translate }}</div>
                          <div class="steps-header-cell">{{ 'Run.expected_result' | translate }}</div>
                          @for (step of sortedDetailSteps; track step.id) {
                            <div class="steps-body-cell">{{ step.step }}</div>
                            <div class="steps-body-cell">{{ step.result }}</div>
                          }
                        </div>
                      </div>
                    }

                    @if (selectedCaseDetail.template === 0) {
                      @if (selectedCaseDetail.preConditions) {
                        <div class="detail-section">
                          <h4 class="detail-label">{{ 'Run.preconditions_label' | translate }}</h4>
                          <p class="detail-text">{{ selectedCaseDetail.preConditions }}</p>
                        </div>
                      }
                      @if (selectedCaseDetail.expectedResults) {
                        <div class="detail-section">
                          <h4 class="detail-label">{{ 'Run.expected_label' | translate }}</h4>
                          <p class="detail-text">{{ selectedCaseDetail.expectedResults }}</p>
                        </div>
                      }
                    }
                  </div>
                }
              }

              <!-- Comments tab -->
              @if (activeDetailTab === 'comments') {
                @if (selectedRunCaseId === null) {
                  <div class="detail-content">
                    <p class="info-msg">{{ 'Run.include_to_comment' | translate }}</p>
                  </div>
                } @else {
                  <div class="comments-panel">
                    <div class="comments-list">
                      @if (commentsLoading) {
                        <div class="detail-loading"><mat-spinner diameter="24" /></div>
                      } @else if (comments.length === 0) {
                        <p class="no-comments">{{ 'Run.no_comments' | translate }}</p>
                      } @else {
                        @for (comment of comments; track comment.id) {
                          <div class="comment-item">
                            <div class="comment-header">
                              <span class="comment-author">{{ comment.User?.username ?? '—' }}</span>
                              <span class="comment-date">{{ comment.createdAt | date:'dd/MM/yy HH:mm' }}</span>
                              @if (comment.User?.id === currentUserId) {
                                <button class="comment-delete-btn" (click)="deleteComment(comment.id)"
                                        matTooltip="Supprimer" mat-icon-button>
                                  <mat-icon>delete_outline</mat-icon>
                                </button>
                              }
                            </div>
                            <p class="comment-content">{{ comment.content }}</p>
                          </div>
                        }
                      }
                    </div>

                    <div class="comment-form">
                      <textarea class="comment-textarea" [(ngModel)]="commentText" rows="3"
                                [placeholder]="'Run.comment_placeholder' | translate"></textarea>
                      <button mat-flat-button color="primary" class="send-btn"
                              (click)="submitComment()"
                              [disabled]="!commentText.trim() || commentSubmitting">
                        @if (commentSubmitting) {
                          <mat-spinner diameter="16" />
                        } @else {
                          <mat-icon>send</mat-icon>
                          {{ 'Run.send' | translate }}
                        }
                      </button>
                    </div>
                  </div>
                }
              }

              <!-- History tab -->
              @if (activeDetailTab === 'history') {
                <div class="detail-content">
                  <p class="no-comments">{{ 'Run.no_history' | translate }}</p>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 16px; }
    .run-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .back-link { display: flex; align-items: center; gap: 4px; color: #6750a4; text-decoration: none; font-size: 14px; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .header-actions { display: flex; gap: 8px; }
    .run-info-card { margin-bottom: 16px; }
    .run-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
    .run-name-field { flex: 2; min-width: 200px; }
    .run-desc-field { flex: 3; min-width: 200px; }
    /* status-chips now inside status-chips-row */
    .status-chip { padding: 3px 12px; border-radius: 12px; color: white; font-size: 12px; font-weight: 600; }
    .total-chip { background: #6750a4 !important; }
    .editor-layout { display: flex; gap: 0; height: calc(100vh - 300px); border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    .folders-pane { width: 240px; min-width: 180px; border-right: 1px solid #e0e0e0; overflow-y: auto; background: #fff; flex-shrink: 0; }
    .pane-header { padding: 8px 8px 4px 12px; border-bottom: 1px solid #e0e0e0; }
    .pane-title { font-weight: 600; font-size: 14px; }
    .empty-tree { padding: 16px; color: #888; font-size: 13px; }
    .folder-tree { padding: 4px 0; }
    .folder-node { display: flex; align-items: center; padding: 2px 4px; cursor: pointer; border-radius: 6px; margin: 1px 4px; transition: background 0.15s; }
    .folder-node:hover { background: rgba(0,0,0,0.04); }
    .folder-node.selected { background: rgba(103,80,164,0.15); }
    .folder-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 6px; color: #6750a4; }
    .folder-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .folder-badge { background: #6750a4; color: white; border-radius: 10px; padding: 0 6px; font-size: 11px; font-weight: 700; }
    .expand-btn { width: 28px; height: 28px; flex-shrink: 0; }
    .hidden { display: none; }
    ul { list-style: none; padding: 0 0 0 12px; margin: 0; }
    li { list-style: none; }
    mat-tree-node, mat-nested-tree-node { display: block; }
    .cases-pane { flex: 1; overflow: auto; display: flex; flex-direction: column; min-width: 0; }
    .cases-table { width: 100%; }
    .empty-state { text-align: center; padding: 32px; color: #888; }
    .title-cell { display: flex; align-items: center; gap: 6px; }
    .case-title-btn { background: none; border: none; color: #6750a4; cursor: pointer; font-size: 13px; text-align: left; padding: 0; line-height: 1.4; }
    .case-title-btn:hover { text-decoration: underline; }
    .case-title-btn.active { font-weight: 600; }
    .comment-badge { display: inline-flex; align-items: center; gap: 2px; background: #e8def8; color: #6750a4; border-radius: 10px; padding: 1px 6px 1px 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .comment-badge-icon { font-size: 12px; width: 12px; height: 12px; }
    .row-selected { background: rgba(103,80,164,0.06); }
    .status-select { font-size: 12px; min-width: 130px; }
    .mat-column-status { min-width: 140px; }

    /* Detail panel */
    .detail-panel { width: 320px; min-width: 280px; border-left: 1px solid #e0e0e0; background: #fff; display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden; }
    .detail-tabs { display: flex; border-bottom: 1px solid #e0e0e0; flex-shrink: 0; }
    .tab-btn { flex: 1; background: none; border: none; border-bottom: 2px solid transparent; padding: 10px 4px; font-size: 12px; cursor: pointer; color: #666; transition: color 0.15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tab-btn.active { color: #6750a4; border-bottom-color: #6750a4; font-weight: 500; }
    .tab-btn:hover:not(.active) { color: #333; }
    .detail-loading { display: flex; justify-content: center; padding: 32px; }
    .detail-content { padding: 16px; overflow-y: auto; flex: 1; }
    .detail-title { font-size: 14px; font-weight: 600; margin: 0 0 16px; line-height: 1.4; color: #222; }
    .detail-section { margin-bottom: 14px; }
    .detail-label { font-size: 12px; font-weight: 600; color: #333; margin: 0 0 4px; }
    .detail-text { font-size: 13px; color: #555; margin: 0; white-space: pre-wrap; }
    .priority-row { display: flex; align-items: center; gap: 6px; }
    .priority-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .tags-row { display: flex; gap: 4px; flex-wrap: wrap; }
    .tag-chip { background: #e8def8; color: #21005d; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
    .steps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #e0e0e0; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden; margin-top: 6px; }
    .steps-header-cell { background: #f5f5f5; padding: 6px 8px; font-size: 11px; font-weight: 600; color: #555; }
    .steps-body-cell { background: #fff; padding: 8px; font-size: 12px; color: #444; }
    .info-msg { font-size: 13px; color: #888; font-style: italic; }
    .no-comments { font-size: 13px; color: #888; font-style: italic; margin: 0; }

    /* Comments panel */
    .comments-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .comments-list { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
    .comment-item { border: 1px solid #f0f0f0; border-radius: 6px; padding: 8px 10px; background: #fafafa; }
    .comment-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .comment-author { font-size: 12px; font-weight: 600; color: #333; }
    .comment-date { font-size: 11px; color: #999; flex: 1; }
    .comment-delete-btn { width: 24px; height: 24px; line-height: 24px; color: #bbb; }
    .comment-delete-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .comment-delete-btn:hover { color: #e53935; }
    .comment-content { font-size: 13px; color: #444; margin: 0; white-space: pre-wrap; word-break: break-word; }
    .comment-form { padding: 10px 12px; border-top: 1px solid #e0e0e0; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .comment-textarea { width: 100%; resize: none; border: 1px solid #d0d0d0; border-radius: 6px; padding: 8px; font-size: 13px; font-family: inherit; box-sizing: border-box; outline: none; }
    .comment-textarea:focus { border-color: #6750a4; }
    .send-btn { align-self: flex-end; display: flex; align-items: center; gap: 4px; }
    .send-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Tester stats */
    .tester-stats { margin-top: 12px; border-top: 1px solid #e8e0f0; padding-top: 10px; }
    .tester-stats-title { font-size: 12px; font-weight: 600; color: #6750a4; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .tester-table-wrap { overflow-x: auto; }
    .tester-table { border-collapse: collapse; font-size: 12px; min-width: 100%; }
    .tester-table th, .tester-table td { padding: 4px 10px; text-align: center; white-space: nowrap; }
    .tester-table th { font-weight: 600; font-size: 11px; border-bottom: 1px solid #e0e0e0; }
    .tester-table tbody tr:hover { background: rgba(103,80,164,0.04); }
    .tester-table .col-tester { text-align: left; font-weight: 500; color: #333; }
    .tester-table .col-total { font-weight: 600; color: #6750a4; }

    /* Tester view */
    .status-chips-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .status-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .viewing-as-chip { display: flex; align-items: center; gap: 4px; background: #e8f4fd; border: 1px solid #90caf9; border-radius: 16px; padding: 2px 6px 2px 10px; font-size: 12px; font-weight: 600; color: #1565c0; }
    .eye-icon { font-size: 14px; width: 14px; height: 14px; }
    .clear-view-btn { width: 20px; height: 20px; line-height: 20px; }
    .clear-view-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .tester-row-clickable { cursor: pointer; }
    .tester-row-clickable:hover { background: rgba(21,101,192,0.06); }
    .tester-row-active { background: rgba(21,101,192,0.1) !important; }
    .tester-row-active td { color: #1565c0; }
    .tester-eye-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; margin-right: 4px; }
    .tester-table-hint { font-size: 11px; color: #aaa; margin: 4px 0 0; font-style: italic; }
    .tester-view-banner { display: flex; align-items: center; gap: 8px; padding: 6px 16px; background: #e3f2fd; border-bottom: 1px solid #90caf9; font-size: 12px; color: #1565c0; flex-shrink: 0; }
    .tester-view-banner mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .tester-view-banner button { margin-left: auto; }

    /* Config mode */
    .config-banner { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #f3f0ff; border-bottom: 1px solid #e0d9f5; font-size: 12px; color: #6750a4; flex-shrink: 0; }
    .config-icon { font-size: 16px; width: 16px; height: 16px; }
    .inclusion-btn { width: 32px; height: 32px; }
    .included-icon { color: #6ea56c; }
    .excluded-icon { color: #ccc; }
    .row-not-included { opacity: 0.55; }
    .mat-column-select { width: 44px; padding: 0 4px; }
  `],
})
export class RunEditorComponent implements OnInit, CanDeactivateComponent {
  @Input() projectId!: string;
  @Input() runId!: string;

  private runSvc = inject(RunService);
  private folderSvc = inject(FolderService);
  private caseSvc = inject(CaseService);
  private commentSvc = inject(CommentService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = true;
  saving = false;
  isDirty = false;

  run: Run | null = null;
  folders: Folder[] = [];
  allCases: CaseWithRunCase[] = [];
  filteredCases: CaseWithRunCase[] = [];
  selectedFolderId: number | null = null;

  // Detail panel state
  selectedCaseId: number | null = null;
  selectedCaseDetail: Case | null = null;
  caseDetailLoading = false;
  activeDetailTab: 'detail' | 'comments' | 'history' = 'detail';

  // Per-user result tracking
  userResultChanges = new Map<number, number>(); // runCaseId -> newStatus

  // Comments state
  comments: Comment[] = [];
  commentsLoading = false;
  commentSubmitting = false;
  commentText = '';
  commentsLoadedForId: number | null = null;

  runStates = RUN_STATES;
  runCaseStatuses = RUN_CASE_STATUSES;
  runCaseStatusColors = RUN_CASE_STATUS_COLORS;

  treeControl = new NestedTreeControl<FolderNode>(node => node.children);
  treeData = new MatTreeNestedDataSource<FolderNode>();
  hasChildren = (_: number, node: FolderNode) => node.children.length > 0;

  configMode = false;
  viewTesterUserId: number | null = null;
  viewTesterUsername: string | null = null;

  casesDataSource = new MatTableDataSource<CaseWithRunCase>();
  get displayedColumns(): string[] {
    return this.configMode ? ['select', 'id', 'title', 'priority'] : ['id', 'title', 'priority', 'status'];
  }

  form = this.fb.group({ name: [''], state: [0], description: [''] });

  get canManage(): boolean { return this.auth.canManageRuns(parseInt(this.projectId, 10)); }
  get canReport(): boolean { return this.auth.isProjectReporter(parseInt(this.projectId, 10)); }
  get currentUserId(): number | null { return this.auth.currentUser()?.id ?? null; }
  get effectiveViewUserId(): number | null { return this.viewTesterUserId ?? this.currentUserId; }
  get isViewingOtherTester(): boolean {
    return this.viewTesterUserId !== null && this.viewTesterUserId !== this.currentUserId;
  }

  get totalIncluded(): number { return this.allCases.filter(c => this.isIncluded(c)).length; }

  get sortedDetailSteps() {
    return (this.selectedCaseDetail?.Steps ?? [])
      .sort((a, b) => a.caseSteps.stepNo - b.caseSteps.stepNo);
  }

  get selectedRunCaseId(): number | null {
    if (this.selectedCaseId === null) return null;
    const c = this.allCases.find(c => c.id === this.selectedCaseId);
    if (!c || !this.isIncluded(c)) return null;
    const id = c.RunCases[0]?.id ?? -1;
    return id > 0 ? id : null;
  }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    const pid = parseInt(this.projectId, 10);
    const rid = parseInt(this.runId, 10);
    this.loading = true;
    this.userResultChanges.clear();
    forkJoin([
      this.runSvc.getRun(rid),
      this.folderSvc.getFolders(pid),
      this.runSvc.getProjectCases(pid, rid),
    ]).subscribe({
      next: ([{ run }, folders, cases]) => {
        this.run = run;
        this.folders = folders;
        this.allCases = cases.map(c => ({
          ...c,
          RunCases: c.RunCases.map(rc => ({ ...rc, editState: 'notChanged' as const })),
        }));
        this.form.patchValue({ name: run.name, state: run.state, description: run.description });
        this.buildFilteredTree();
        const firstIncluded = this.allCases.find(c => this.isIncluded(c));
        if (firstIncluded) this.selectFolder({ id: firstIncluded.folderId });
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private buildFullTree(): void {
    this.treeData.data = buildFolderTree(this.folders);
    this.treeControl.dataNodes = this.treeData.data;
    this.treeControl.expandAll();
  }

  private buildFilteredTree(): void {
    const directIds = new Set(this.allCases.filter(c => this.isIncluded(c)).map(c => c.folderId));
    const allIds = new Set(directIds);
    let changed = true;
    while (changed) {
      changed = false;
      for (const f of this.folders) {
        if (allIds.has(f.id) && f.parentFolderId !== null && !allIds.has(f.parentFolderId)) {
          allIds.add(f.parentFolderId);
          changed = true;
        }
      }
    }
    const visibleFolders = this.folders.filter(f => allIds.has(f.id));
    this.treeData.data = buildFolderTree(visibleFolders);
    this.treeControl.dataNodes = this.treeData.data;
    this.treeControl.expandAll();
  }

  selectFolder(node: { id: number }): void {
    this.selectedFolderId = node.id;
    this.filteredCases = this.allCases.filter(
      c => c.folderId === node.id && (this.configMode || this.isIncluded(c))
    );
    this.casesDataSource.data = this.filteredCases;
  }

  toggleConfigMode(): void {
    this.configMode = !this.configMode;
    this.selectedCaseId = null;
    this.selectedCaseDetail = null;
    if (this.configMode) {
      this.buildFullTree();
      const fid = this.selectedFolderId ?? this.folders[0]?.id ?? null;
      if (fid !== null) this.selectFolder({ id: fid });
    } else {
      this.buildFilteredTree();
      const firstIncluded = this.allCases.find(c => this.isIncluded(c));
      if (firstIncluded) {
        this.selectFolder({ id: firstIncluded.folderId });
      } else {
        this.selectedFolderId = null;
        this.filteredCases = [];
        this.casesDataSource.data = [];
      }
    }
  }

  toggleInclusion(c: CaseWithRunCase): void {
    this.isDirty = true;
    if (c.RunCases.length === 0) {
      c.RunCases = [{ id: 0, runId: parseInt(this.runId, 10), caseId: c.id, status: 0, editState: 'new' }];
    } else {
      const rc = c.RunCases[0];
      if (rc.editState === 'new' && rc.id === 0) {
        c.RunCases = [];
      } else if (rc.editState === 'deleted') {
        rc.editState = 'notChanged';
      } else {
        rc.editState = 'deleted';
      }
    }
  }

  openCaseDetail(caseId: number): void {
    if (this.selectedCaseId === caseId) {
      this.selectedCaseId = null;
      this.selectedCaseDetail = null;
      this.comments = [];
      this.commentsLoadedForId = null;
      return;
    }
    this.selectedCaseId = caseId;
    this.activeDetailTab = 'detail';
    this.caseDetailLoading = true;
    this.selectedCaseDetail = null;
    this.comments = [];
    this.commentsLoadedForId = null;
    this.caseSvc.getCase(caseId).subscribe({
      next: (tc) => { this.selectedCaseDetail = tc; this.caseDetailLoading = false; },
      error: () => { this.caseDetailLoading = false; },
    });
  }

  setDetailTab(tab: 'detail' | 'comments' | 'history'): void {
    this.activeDetailTab = tab;
    if (tab === 'comments') this.loadCommentsIfNeeded();
  }

  loadCommentsIfNeeded(): void {
    const rcId = this.selectedRunCaseId;
    if (rcId === null || rcId === this.commentsLoadedForId) return;
    this.commentsLoading = true;
    const viewUserId = this.effectiveViewUserId ?? undefined;
    this.commentSvc.getComments('RunCase', rcId, viewUserId).subscribe({
      next: (c) => { this.comments = c; this.commentsLoading = false; this.commentsLoadedForId = rcId; },
      error: () => { this.commentsLoading = false; },
    });
  }

  private refreshComments(): void {
    this.comments = [];
    this.commentsLoadedForId = null;
    if (this.activeDetailTab === 'comments') this.loadCommentsIfNeeded();
  }

  submitComment(): void {
    const text = this.commentText.trim();
    const rcId = this.selectedRunCaseId;
    if (!text || rcId === null) return;
    this.commentSubmitting = true;
    this.commentSvc.addComment('RunCase', rcId, text).subscribe({
      next: (c) => {
        this.comments = [...this.comments, c];
        this.commentText = '';
        this.commentSubmitting = false;
        const found = this.allCases.find(cc => cc.RunCases[0]?.id === rcId);
        if (found?.RunCases[0]) found.RunCases[0].commentCount = (found.RunCases[0].commentCount ?? 0) + 1;
      },
      error: () => { this.commentSubmitting = false; },
    });
  }

  deleteComment(commentId: number): void {
    const rcId = this.selectedRunCaseId;
    this.commentSvc.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== commentId);
        const found = this.allCases.find(cc => cc.RunCases[0]?.id === rcId);
        if (found?.RunCases[0] && (found.RunCases[0].commentCount ?? 0) > 0) found.RunCases[0].commentCount!--;
      },
    });
  }

  isIncluded(c: CaseWithRunCase): boolean {
    return c.RunCases.length > 0 && c.RunCases[0].editState !== 'deleted';
  }

  getRunCaseStatus(c: CaseWithRunCase): number {
    const rc = c.RunCases[0];
    if (!rc) return 0;
    return rc.RunCaseResults?.find(r => r.userId === this.effectiveViewUserId)?.status ?? 0;
  }

  getFolderIncludedCount(folderId: number): number {
    return this.allCases.filter(c => c.folderId === folderId && this.isIncluded(c)).length;
  }

  getMyStatusCount(status: number): number {
    const userId = this.effectiveViewUserId;
    return this.allCases.filter(c => this.isIncluded(c)).filter(c => {
      const result = c.RunCases[0]?.RunCaseResults?.find(r => r.userId === userId);
      return (result?.status ?? 0) === status;
    }).length;
  }

  get testerStats(): { userId: number; username: string; counts: number[]; total: number }[] {
    const included = this.allCases.filter(c => this.isIncluded(c));
    const total = included.length;
    const userMap = new Map<number, { username: string; counts: number[] }>();
    for (const c of included) {
      for (const r of c.RunCases[0]?.RunCaseResults ?? []) {
        if (!userMap.has(r.userId)) {
          userMap.set(r.userId, {
            username: r.User?.username ?? `#${r.userId}`,
            counts: new Array(RUN_CASE_STATUSES.length).fill(0),
          });
        }
        const entry = userMap.get(r.userId)!;
        if (r.status >= 0 && r.status < RUN_CASE_STATUSES.length) entry.counts[r.status]++;
      }
    }
    return Array.from(userMap.entries())
      .map(([userId, { username, counts }]) => {
        const touched = counts.reduce((s, n) => s + n, 0);
        const result = [...counts];
        result[0] += total - touched; // untouched cases count as "Non testé"
        return { userId, username, counts: result, total };
      })
      .sort((a, b) => a.username.localeCompare(b.username));
  }

  selectTesterView(userId: number, username: string): void {
    if (this.viewTesterUserId === userId) {
      this.clearTesterView();
    } else {
      this.viewTesterUserId = userId;
      this.viewTesterUsername = username;
      this.refreshComments();
      this.reloadCommentCounts(userId);
    }
  }

  clearTesterView(): void {
    this.viewTesterUserId = null;
    this.viewTesterUsername = null;
    this.refreshComments();
    this.reloadCommentCounts(null);
  }

  private reloadCommentCounts(viewUserId: number | null): void {
    const pid = parseInt(this.projectId, 10);
    const rid = parseInt(this.runId, 10);
    const uid = viewUserId !== null ? viewUserId : undefined;
    this.runSvc.getProjectCases(pid, rid, {}, uid).subscribe(fresh => {
      for (const freshCase of fresh) {
        const existing = this.allCases.find(c => c.id === freshCase.id);
        if (existing && existing.RunCases[0] !== undefined && freshCase.RunCases[0] !== undefined) {
          existing.RunCases[0].commentCount = freshCase.RunCases[0].commentCount;
        }
      }
    });
  }

  getPriorityLabel(index: number): string { return PRIORITIES[index] ?? String(index); }
  getPriorityColor(index: number): string { return PRIORITY_COLORS[index] ?? '#ccc'; }
  getTypeLabel(index: number): string { return TEST_TYPES[index] ?? String(index); }

  markDirty(): void { this.isDirty = true; }
  canDeactivate(): boolean { return !this.isDirty; }

  changeStatus(c: CaseWithRunCase, newStatus: number): void {
    if (!this.isIncluded(c)) return;
    const userId = this.currentUserId;
    if (userId === null) return;
    this.isDirty = true;
    const rc = c.RunCases[0];
    if (!rc.RunCaseResults) rc.RunCaseResults = [];
    const existing = rc.RunCaseResults.find(r => r.userId === userId);
    if (existing) {
      existing.status = newStatus;
    } else {
      rc.RunCaseResults.push({ id: 0, runCaseId: rc.id, userId, status: newStatus });
    }
    this.userResultChanges.set(rc.id, newStatus);
  }

  onSave(): void {
    if (!this.run) return;
    this.saving = true;
    const rid = parseInt(this.runId, 10);
    const { name, state, description } = this.form.value;
    const obs: { [key: string]: Observable<unknown> } = {};

    if (this.canManage) {
      obs['run'] = this.runSvc.updateRun(rid, { name: name!, state: state!, description: description! });
      const runCasesToUpdate: RunCase[] = this.allCases
        .filter(c => c.RunCases.length > 0)
        .map(c => ({
          id: c.RunCases[0].id, runId: rid, caseId: c.id,
          status: c.RunCases[0].status, editState: c.RunCases[0].editState,
        }));
      obs['cases'] = this.runSvc.updateRunCases(rid, runCasesToUpdate);
    }

    if (this.userResultChanges.size > 0) {
      const results = Array.from(this.userResultChanges.entries()).map(([runCaseId, status]) => ({ runCaseId, status }));
      obs['results'] = this.runSvc.updateUserResults(rid, results);
    }

    if (Object.keys(obs).length === 0) {
      this.saving = false;
      this.isDirty = false;
      return;
    }

    forkJoin(obs).subscribe({
      next: (res) => {
        this.userResultChanges.clear();
        this.isDirty = false;
        this.saving = false;
        this.snackBar.open('Campagne mise à jour', 'OK', { duration: 2000 });
        if (this.canManage) {
          this.run = res['run'] as Run;
          const pid = parseInt(this.projectId, 10);
          this.runSvc.getProjectCases(pid, rid).subscribe(fresh => {
            this.allCases = fresh.map(c => ({
              ...c,
              RunCases: c.RunCases.map(rc => ({ ...rc, editState: 'notChanged' as const })),
            }));
            if (this.configMode) this.buildFullTree(); else this.buildFilteredTree();
            if (this.selectedFolderId !== null) {
              this.selectFolder({ id: this.selectedFolderId });
            } else if (!this.configMode) {
              const first = this.allCases.find(c => this.isIncluded(c));
              if (first) this.selectFolder({ id: first.folderId });
            }
          });
        }
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
      },
    });
  }
}
