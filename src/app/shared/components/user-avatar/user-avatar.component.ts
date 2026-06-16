import { Component, Input } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  template: `
    <div
      class="avatar-wrap"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.font-size.px]="size * 0.38"
    >
      @if (avatarUrl) {
        <img [src]="avatarUrl" [alt]="username ?? ''" class="avatar-img" />
      } @else {
        <span class="avatar-initial">{{ initial }}</span>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }
    .avatar-wrap {
      border-radius: 50%;
      overflow: hidden;
      background: #7c4dff;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-initial { font-weight: 600; line-height: 1; text-transform: uppercase; }
  `],
})
export class UserAvatarComponent {
  @Input() username: string | null | undefined = null;
  @Input() avatarPath: string | null | undefined = null;
  @Input() size = 40;

  private readonly api = environment.apiUrl;

  get avatarUrl(): string | null {
    return this.avatarPath ? `${this.api}${this.avatarPath}` : null;
  }

  get initial(): string {
    return this.username ? this.username[0].toUpperCase() : '?';
  }
}
