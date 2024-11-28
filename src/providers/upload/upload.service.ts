import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CloudinaryResponse } from './interfaces/cloudinary-response.interface';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'default',
  ): Promise<CloudinaryResponse> {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Validar tipo de arquivo
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.');
      }

      // Validar tamanho do arquivo (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
            width: 1920,
            crop: 'limit',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        uploadStream.end(file.buffer);
      });

      return {
        asset_id: uploadResult.asset_id,
        public_id: uploadResult.public_id,
        version: uploadResult.version,
        version_id: uploadResult.version_id,
        signature: uploadResult.signature,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        resource_type: uploadResult.resource_type,
        created_at: uploadResult.created_at,
        tags: uploadResult.tags,
        bytes: uploadResult.bytes,
        type: uploadResult.type,
        etag: uploadResult.etag,
        placeholder: uploadResult.placeholder,
        url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        folder: uploadResult.folder,
        original_filename: uploadResult.original_filename,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}
