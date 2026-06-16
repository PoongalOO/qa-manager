import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { MemberService } from '../../../../core/services/member.service';
import { UserAvatarComponent } from '../../.././../shared/components/user-avatar/user-avatar.component';
import { User } from '../../../../core/models/user.model';

export interface AddMemberDialogData {
  projectId: number;
}

@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatProgressSpinnerModule,
    UserAvatarComponent,
  ],
  template: `
    <h2 mat-dialog-title>Ajouter un membre</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Rechercher par nom ou email</mat-label>
        <input matInput [formControl]="searchCtrl" />
      </mat-form-field>

      @if (loading) {
        <div class="spinner-center"><mat-spinner diameter="32" /></div>
      } @else if (candidates.length === 0) {
        <p class="empty">Aucun utilisateur trouvé.</p>
      } @else {
        <mat-selection-list [multiple]="false">
          @for (user of candidates; track user.id) {
            <mat-list-option (click)="select(user)">
              <div class="user-row">
                <app-user-avatar [username]="user.username" [avatarPath]="user.avatarPath" [size]="32" />
                <div class="user-info">
                  <span class="name">{{ user.username }}</span>
                  <span class="email">{{ user.email }}</span>
                </div>
              </div>
            </mat-list-option>
          }
        </mat-selection-list>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; min-width: 380px; }
    .spinner-center { display: flex; justify-content: center; padding: 16px; }
    .empty { color: #888; text-align: center; padding: 16px; }
    .user-row { display: flex; align-items: center; gap: 12px; }
    .user-info { display: flex; flex-direction: column; }
    .email { font-size: 0.8rem; color: #666; }
  `],
})
export class AddMemberDialogComponent implements OnInit {
  readonly data = inject<AddMemberDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AddMemberDialogComponent>);
  private readonly memberSvc = inject(MemberService);

  readonly searchCtrl = new FormControl('');
  candidates: User[] = [];
  loading = false;

  ngOnInit(): void {
    this.searchCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        this.loading = true;
        return this.memberSvc.searchUsers(this.data.projectId, search ?? undefined);
      }),
    ).subscribe({
      next: users => { this.candidates = users; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  select(user: User): void { this.dialogRef.close(user); }
  cancel(): void { this.dialogRef.close(); }
}
