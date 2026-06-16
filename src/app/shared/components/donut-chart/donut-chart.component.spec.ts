import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DonutChartComponent } from './donut-chart.component';

describe('DonutChartComponent', () => {
  let component: DonutChartComponent;
  let fixture: ComponentFixture<DonutChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutChartComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DonutChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('total is 0 with no segments', () => {
    expect(component.total).toBe(0);
  });

  it('total sums segment values', () => {
    component.segments = [
      { label: 'A', value: 3, color: '#f00' },
      { label: 'B', value: 7, color: '#0f0' },
    ];
    expect(component.total).toBe(10);
  });

  it('circumference = 2π × 55', () => {
    expect(component.circumference).toBeCloseTo(2 * Math.PI * 55, 5);
  });

  it('svgSegments excludes zero-value segments', () => {
    component.segments = [
      { label: 'A', value: 5, color: '#f00' },
      { label: 'B', value: 0, color: '#0f0' },
      { label: 'C', value: 3, color: '#00f' },
    ];
    expect(component.svgSegments.length).toBe(2);
    expect(component.svgSegments.map(s => s.label)).toEqual(['A', 'C']);
  });

  it('single segment: dashArray gap=0 and dashOffset=0', () => {
    const C = 2 * Math.PI * 55;
    component.segments = [{ label: 'All', value: 1, color: '#f00' }];
    const [seg] = component.svgSegments;
    const [gap, dash] = seg.dashArray.split(' ').map(Number);
    expect(gap).toBeCloseTo(0, 5);
    expect(dash).toBeCloseTo(C, 5);
    expect(seg.dashOffset).toBeCloseTo(0, 5);
  });

  it('two equal halves accumulate dashOffset correctly', () => {
    const C = 2 * Math.PI * 55;
    component.segments = [
      { label: 'A', value: 1, color: '#f00' },
      { label: 'B', value: 1, color: '#0f0' },
    ];
    const [a, b] = component.svgSegments;
    // A: l=C/2, s=0 → dashOffset = C - C/2 - 0 = C/2
    expect(a.dashOffset).toBeCloseTo(C / 2, 5);
    // B: l=C/2, s=C/2 → dashOffset = C - C/2 - C/2 = 0
    expect(b.dashOffset).toBeCloseTo(0, 5);
  });

  it('svgSegments count matches non-zero input segments', () => {
    component.segments = [
      { label: 'X', value: 2, color: '#abc' },
      { label: 'Y', value: 3, color: '#def' },
    ];
    expect(component.svgSegments.length).toBe(2);
  });

  it('renders title when input is set', () => {
    component.title = 'Par priorité';
    fixture.detectChanges();
    const h4 = fixture.nativeElement.querySelector('.chart-title');
    expect(h4?.textContent).toContain('Par priorité');
  });

  it('renders no title element when title is empty', () => {
    component.title = '';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.chart-title')).toBeNull();
  });
});
