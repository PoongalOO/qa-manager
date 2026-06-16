import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserAvatarComponent } from './user-avatar.component';

describe('UserAvatarComponent', () => {
  let component: UserAvatarComponent;
  let fixture: ComponentFixture<UserAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('initial returns first char of username uppercased', () => {
    component.username = 'alice';
    expect(component.initial).toBe('A');
  });

  it('initial returns "?" when username is null', () => {
    component.username = null;
    expect(component.initial).toBe('?');
  });

  it('avatarUrl is null when avatarPath is null', () => {
    component.avatarPath = null;
    expect(component.avatarUrl).toBeNull();
  });

  it('avatarUrl builds full URL from avatarPath', () => {
    component.avatarPath = '/avatars/user.jpg';
    expect(component.avatarUrl).toBe('/api/avatars/user.jpg');
  });

  it('size input controls rendered dimensions', () => {
    component.size = 48;
    fixture.detectChanges();
    const wrap = fixture.nativeElement.querySelector('.avatar-wrap') as HTMLElement;
    expect(wrap.style.width).toBe('48px');
    expect(wrap.style.height).toBe('48px');
  });

  it('shows img element when avatarPath is set', () => {
    component.avatarPath = '/avatars/user.jpg';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
  });

  it('shows initial span when avatarPath is null', () => {
    component.avatarPath = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.avatar-initial')).toBeTruthy();
  });
});
