import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DataUploadController } from './data-upload.controller';
import { DataUploadService } from './data-upload.service';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  ],
  controllers: [DataUploadController],
  providers: [DataUploadService],
})
export class DataUploadModule {}
