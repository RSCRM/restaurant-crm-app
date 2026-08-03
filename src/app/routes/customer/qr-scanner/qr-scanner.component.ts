import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { customerErrorMessage } from '../customer-error';
import { CustomerQrService } from '../customer-qr.service';
import { QrResolveResponse } from '../customer.model';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzAlertModule, NzButtonModule, NzCardModule, NzDescriptionsModule, NzSpinModule],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.less']
})
export class QrScannerComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly message = inject(NzMessageService);
  private readonly qrService = inject(CustomerQrService);
  private readonly destroyRef = inject(DestroyRef);

  private html5QrCode: Html5Qrcode | null = null;
  private qrToken = '';

  resolving = false;
  cameraError = '';
  table: QrResolveResponse | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const token = params.get('qr');
      if (token) {
        this.qrToken = token;
        void this.stopScanner();
        this.resolveTable(token);
      } else {
        this.table = null;
        this.cameraError = '';
        this.cdr.markForCheck();
        setTimeout(() => this.startScanner(), 100);
      }
    });
  }

  startScanner(): void {
    if (this.html5QrCode?.isScanning) {
      return;
    }
    this.cameraError = '';
    this.cdr.markForCheck();

    this.html5QrCode = new Html5Qrcode('qr-reader', {
      verbose: false,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true }
    });

    const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => {
      const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.9);
      return { width: size, height: size };
    };

    this.html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 25, qrbox, aspectRatio: 1.333333 },
        decodedText => this.onDecoded(decodedText),
        () => {}
      )
      .catch(() => {
        this.cameraError = 'Không thể truy cập camera. Vui lòng cấp quyền và thử lại.';
        this.cdr.markForCheck();
      });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    await this.stopScanner();

    const fileScanner = new Html5Qrcode('qr-file-temp');
    try {
      const decodedText = await fileScanner.scanFile(file, true);
      this.handleQrResult(decodedText);
    } catch {
      this.message.error('Không tìm thấy mã QR trong ảnh này.');
      setTimeout(() => this.startScanner(), 100);
    } finally {
      input.value = '';
    }
  }

  async stopScanner(): Promise<void> {
    if (this.html5QrCode?.isScanning) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch {
        this.html5QrCode = null;
      }
    }
  }

  openSession(): void {
    if (!this.table) {
      return;
    }
    this.router.navigate(['/customer/verify'], { state: { qrToken: this.qrToken, table: this.table } });
  }

  rescan(): void {
    this.router.navigate(['/customer/scan']);
  }

  ngOnDestroy(): void {
    void this.stopScanner();
  }

  private onDecoded(decodedText: string): void {
    void this.stopScanner();
    this.handleQrResult(decodedText);
  }

  private handleQrResult(decodedText: string): void {
    const tableToken = this.extractParam(decodedText, 'qr');
    if (tableToken) {
      this.router.navigate(['/customer/scan'], { queryParams: { qr: tableToken } });
      return;
    }
    const groupToken = this.extractParam(decodedText, 'gqr');
    if (groupToken) {
      this.router.navigate(['/customer/join'], { queryParams: { gqr: groupToken } });
      return;
    }
    this.message.warning('Mã QR này không phải mã QR bàn của nhà hàng. Vui lòng quét đúng mã dán trên bàn.');
    setTimeout(() => this.startScanner(), 2000);
  }

  private extractParam(source: string, key: string): string | null {
    const match = source.match(new RegExp(`[?&]${key}=([^&#]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  private resolveTable(token: string): void {
    this.resolving = true;
    this.cameraError = '';
    this.cdr.markForCheck();

    this.qrService.resolve(token).subscribe({
      next: table => {
        this.resolving = false;
        this.table = table;
        this.cdr.markForCheck();
      },
      error: error => {
        this.resolving = false;
        this.table = null;
        this.message.error(customerErrorMessage(error));
        this.cdr.markForCheck();
      }
    });
  }
}
