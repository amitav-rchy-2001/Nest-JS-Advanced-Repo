import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

export type StoredFile = {
  fileUrl: string;
  fileKey: string;
  mimeType?: string;
  fileSizeBytes?: number;
};

@Injectable()
export class CloudinaryStorageService {
  constructor(private readonly configService: ConfigService) {}

  async upload(file: Express.Multer.File, folder: string): Promise<StoredFile> {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const uploadPreset = this.configService.get<string>(
      'CLOUDINARY_UPLOAD_PRESET',
    );

    if (cloudName && uploadPreset) {
      const formData = new FormData();
      formData.append(
        'file',
        `data:${file.mimetype || 'application/octet-stream'};base64,${file.buffer.toString(
          'base64',
        )}`,
      );
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: formData },
      );

      if (response.ok) {
        const data = (await response.json()) as {
          secure_url: string;
          public_id: string;
        };

        return {
          fileUrl: data.secure_url,
          fileKey: data.public_id,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
        };
      }
    }

    const digest = createHash('sha256')
      .update(file.buffer)
      .update(file.originalname)
      .digest('hex')
      .slice(0, 24);

    return {
      fileUrl: `cloudinary://pending/${folder}/${digest}`,
      fileKey: `${folder}/${digest}`,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
    };
  }
}
