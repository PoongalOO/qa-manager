import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MembersComponent } from './members.component';
import { MemberService } from '../../../../core/services/member.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Member } from '../../../../core/models/project.model';
import { ROLE_ADMIN } from '../../../../core/models/user.model';
import { provideTranslateService } from '@ngx-translate/core';

const mockMember: Member = {
  id: 1, userId: 2, projectId: 1, role: 2, createdAt: '', updatedAt: '',
  User: { id: 2, username: 'alice', email: 'alice@test.com', avatarPath: null },
};

describe('MembersComponent', () => {
  let component: MembersComponent;
  let fixture: ComponentFixture<MembersComponent>;
  let memberSvc: jasmine.SpyObj<MemberService>;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    memberSvc = jasmine.createSpyObj('MemberService', [
      'getMembers', 'addMember', 'updateMemberRole', 'deleteMember', 'searchUsers',
    ]);
    memberSvc.getMembers.and.returnValue(of([mockMember]));

    await TestBed.configureTestingModule({
      imports: [MembersComponent, NoopAnimationsModule],
      providers: [
        ...provideTranslateService({ fallbackLang: 'fr' }),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MemberService, useValue: memberSvc },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth['_token'].set({
      access_token: 'tok', expires_at: Date.now() + 3_600_000,
      user: { id: 1, email: 'a@a.com', username: 'admin', role: ROLE_ADMIN, avatarPath: null, locale: null, createdAt: '', updatedAt: '' },
    });

    http = TestBed.inject(HttpTestingController);
    http.match(r => r.url.includes('/me/roles')).forEach(r => r.flush([]));

    fixture = TestBed.createComponent(MembersComponent);
    component = fixture.componentInstance;
    component.projectId = '1';
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should create', () => expect(component).toBeTruthy());

  it('loads members on init when canManage', () => {
    expect(memberSvc.getMembers).toHaveBeenCalledWith(1);
  });

  it('populates members list', () => expect(component.members).toEqual([mockMember]));

  it('sets loading false after load', () => expect(component.loading).toBeFalse());

  it('roleLabel returns correct label', () => {
    expect(component.roleLabel(0)).toBe('Manager');
    expect(component.roleLabel(1)).toBe('Développeur');
    expect(component.roleLabel(2)).toBe('Reporter');
  });

  it('canManage is true for admin', () => expect(component.canManage).toBeTrue());
});
