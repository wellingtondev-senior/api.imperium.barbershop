import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Optional folder name for the upload',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('folder') folder?: string,
  ) {
    try {
      return await this.uploadService.uploadImage(file, folder);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Delete an uploaded image' })
  async deleteImage(@Param('publicId') publicId: string) {
    try {
      const result = await this.uploadService.deleteImage(publicId);
      if (!result) {
        throw new BadRequestException('Failed to delete image');
      }
      return { message: 'Image deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
