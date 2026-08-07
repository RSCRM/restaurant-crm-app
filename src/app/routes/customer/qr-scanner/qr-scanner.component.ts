import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzCardModule, NzButtonModule],
  templateUrl: './qr-scanner.component.html'
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private message = inject(NzMessageService);
  private ngZone = inject(NgZone);

  private html5QrCode: Html5Qrcode | null = null;
  scanning = false;
  errorMessage = '';

  ngAfterViewInit(): void {
    setTimeout(() => this.startScanner(), 100);
  }

  startScanner(): void {
    this.scanning = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    // Khởi tạo instance với Engine nhận diện tốc độ cao
    this.html5QrCode = new Html5Qrcode('qr-reader', {
      verbose: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    });

    // Hàm tính ô quét linh hoạt chiếm 90% diện tích Camera
    const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.floor(minEdge * 0.9);
      return { width: size, height: size };
    };

    this.html5QrCode
      .start(
        { facingMode: 'environment' },
        {
          fps: 25, // Quét 25 khung hình/giây
          qrbox: qrboxFunction,
          aspectRatio: 1.333333
        },
        (decodedText: string) => {
          console.log('📷 Đã quét thành công mã QR:', decodedText);
          this.ngZone.run(() => {
            this.message.success('⚡ Nhận diện mã QR thành công!');
            this.stopScanner();
            this.handleQrResult(decodedText);
          });
        },
        () => {}
      )
      .catch((err: unknown) => {
        console.error('Lỗi Camera:', err);
        this.scanning = false;
        this.errorMessage = 'Không thể truy cập Camera. Vui lòng cấp quyền!';
        this.cdr.markForCheck();
      });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.message.loading('Đang đọc tệp ảnh mã QR...');

    await this.stopScanner();

    const fileScanner = new Html5Qrcode('qr-file-temp');

    try {
      // Luôn resize về 800px trước — ảnh quá to sẽ bị thu nhỏ, ảnh quá nhỏ sẽ phóng to
      const resizedFile = await this.resizeQrFile(file, 800);
      let decodedText: string;
      try {
        decodedText = await fileScanner.scanFile(resizedFile, false);
      } catch {
        // Nếu resize vẫn fail → thử file gốc
        decodedText = await fileScanner.scanFile(file, false);
      }
      console.log('📁 [FILE SCAN LOG] Đã đọc thành công mã QR từ tệp ảnh:', decodedText);
      this.ngZone.run(() => {
        this.message.success('⚡ Đã đọc mã QR từ tệp ảnh!');
        this.handleQrResult(decodedText);
      });
    } catch {
      this.ngZone.run(() => {
        this.message.error('Không tìm thấy mã QR trong tệp ảnh này.');
        this.cdr.markForCheck();
      });
    } finally {
      input.value = '';
      fileScanner.clear();
    }
  }

  /**
   * Resize ảnh QR về kích thước tối ưu để thư viện decode được.
   * Ảnh quá lớn sẽ bị thu nhỏ, ảnh quá nhỏ sẽ được phóng to.
   */
  private async resizeQrFile(file: File, targetSize = 800): Promise<File> {
    const image = await createImageBitmap(file);
    try {
      const minEdge = Math.min(image.width, image.height);
      const scale = targetSize / minEdge;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext('2d')!;
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(value => (value ? resolve(value) : reject(new Error('Cannot resize QR image'))), 'image/png')
      );
      return new File([blob], file.name, { type: 'image/png' });
    } finally {
      image.close();
    }
  }

  async stopScanner(): Promise<void> {
    this.scanning = false;
    if (this.html5QrCode && this.html5QrCode.isScanning) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch {
        // Ignore error
      }
    }
  }

  private handleQrResult(urlResult: string): void {
    // 1. Nếu chứa token Bàn trong URL (VD: http://.../public/qr-order?token=XXX)
    if (urlResult.includes('token=')) {
      const tokenIndex = urlResult.indexOf('token=');
      const token = urlResult.substring(tokenIndex + 6);
      this.router.navigate(['/public/qr-order'], { queryParams: { token } });
      return;
    }

    // 2. Nếu quét trực tiếp chuỗi JWT token Bàn thuần túy (dạng header.payload.sig)
    if (urlResult.includes('.')) {
      const parts = urlResult.split('.');
      if (parts.length === 3) {
        this.router.navigate(['/public/qr-order'], { queryParams: { token: urlResult } });
        return;
      }
    }

    // 3. Nếu là mã QR không liên quan (VD: link Google Play, Wifi, web bên ngoài)
    this.message.warning('Mã QR này không phải là mã QR Bàn của Nhà hàng! Vui lòng quét đúng mã QR dán trên bàn.');

    // Tự động bật lại Scanner sau 2 giây để khách quét lại
    setTimeout(() => {
      this.startScanner();
    }, 2000);
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }
}
