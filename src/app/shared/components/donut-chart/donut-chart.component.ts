import { Component, Input } from '@angular/core';

export interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

interface SvgSegment extends ChartSegment {
  dashArray: string;
  dashOffset: number;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  template: `
    <div class="chart-wrap">
      @if (title) {
        <h4 class="chart-title">{{ title }}</h4>
      }
      <svg width="140" height="140" viewBox="0 0 140 140">
        <g transform="rotate(-90 70 70)">
          <circle cx="70" cy="70" r="55" fill="none" stroke="var(--surface-muted)" stroke-width="30" />
          @for (seg of svgSegments; track seg.label) {
            <circle cx="70" cy="70" r="55" fill="none"
              [attr.stroke]="seg.color"
              stroke-width="30"
              [attr.stroke-dasharray]="seg.dashArray"
              [attr.stroke-dashoffset]="seg.dashOffset" />
          }
        </g>
        <text x="70" y="70" text-anchor="middle" dominant-baseline="middle"
              font-size="20" font-weight="700" fill="var(--text-primary)">{{ total }}</text>
      </svg>
      <div class="legend">
        @for (seg of segments; track seg.label) {
          @if (seg.value > 0) {
            <div class="legend-item">
              <span class="dot" [style.background-color]="seg.color"></span>
              <span>{{ seg.label }} ({{ seg.value }})</span>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: inline-block; }
    .chart-wrap { display: flex; flex-direction: column; align-items: center; }
    .chart-title { margin: 0 0 8px; font-size: 0.95rem; font-weight: 600; text-align: center; }
    .legend { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  `],
})
export class DonutChartComponent {
  @Input() segments: ChartSegment[] = [];
  @Input() title = '';

  readonly radius = 55;

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get total(): number {
    return this.segments.reduce((sum, s) => sum + s.value, 0);
  }

  get svgSegments(): SvgSegment[] {
    const C = this.circumference;
    const total = this.total || 1;
    let cumulative = 0;
    return this.segments
      .filter(s => s.value > 0)
      .map(s => {
        const l = (s.value / total) * C;
        const dashOffset = C - l - cumulative;
        cumulative += l;
        return { ...s, dashArray: `${C - l} ${l}`, dashOffset };
      });
  }
}
