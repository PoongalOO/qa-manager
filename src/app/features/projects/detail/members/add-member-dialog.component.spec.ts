import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AddMemberDialogComponent } from './add-member-dialog.component';
import { MemberService } from '../../../../core/services/member.service';
import { User } from '../../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockUser: User = {
  id: 1, email: 'u@u.com', username: 'user1', role: 1,
  avatarPath: null, locale: null, createdAt: '', updatedAt: '',
};

describe('AddMemberDialogComponent', () => {
  let component: AddMemberDialogComponent;
  let fixture: ComponentFixture<AddMemberDialogComponent>;
  let memberSvc: jasmine.SpyObj<MemberService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AddMemberDialogComponent>>;

  beforeEach(async () => {
    memberSvc = jasmine.createSpyObj('MemberService', [
      'searchUsers', 'getMembers', 'addMember', 'deleteMember', 'updateMemberRole',
    ]);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    memberSvc.searchUsers.and.returnValue(of([mockUser]));

    await TestBed.configureTestingModule({
      imports: [AddMemberDialogComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        { provide: MemberService, useValue: memberSvc },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { projectId: 1 } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddMemberDialogComponent);
    component = fixture.componentInstance;
    // detectChanges not called here to allow fakeAsync in individual tests
  });

  afterEach(() => localStorage.clear());

  it('should create', () => expect(component).toBeTruthy());

  it('candidates is empty before init', () => {
    expect(component.candidates).toEqual([]);
  });

  it('loads candidates after debounce on init', fakeAsync(() => {
    fixture.detectChanges(); // triggers ngOnInit
    tick(300);               // advance past debounceTime
    expect(memberSvc.searchUsers).toHaveBeenCalledWith(1, '');
    expect(component.candidates.length).toBe(1);
    expect(component.loading).toBeFalse();
  }));

  it('select closes dialog with the selected user', fakeAsync(() => {
    fixture.detectChanges();
    tick(300);
    component.select(mockUser);
    expect(dialogRef.close).toHaveBeenCalledWith(mockUser);
  }));

  it('cancel closes dialog without value', fakeAsync(() => {
    fixture.detectChanges();
    tick(300);
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith();
  }));
});
