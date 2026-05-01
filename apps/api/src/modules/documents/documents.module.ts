import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — PDFs/reports
    }),
    ContentModule, // for R2Service
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
