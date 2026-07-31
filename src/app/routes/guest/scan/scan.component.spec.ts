import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { TableOutline, QrcodeOutline } from '@ant-design/icons-angular/icons';

import { ScanComponent } from './scan.component';

describe('ScanComponent', () => {
  let component: ScanComponent;
  let fixture: ComponentFixture<ScanComponent>;

  const mockRouter = {
    navigate: vi.fn()
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [ScanComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: NZ_ICONS, useValue: [TableOutline, QrcodeOutline] }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create scan component', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate when simulateScan is called', () => {
    component.simulateScan('table-1', 'branch-1');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/guest/table', 'table-1'], {
      queryParams: { branchId: 'branch-1' }
    });
  });
});
