import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { R2Service } from './r2.service';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    }),
  ],
  controllers: [ContentController],
  providers: [ContentService, R2Service],
  exports: [ContentService, R2Service],
})
export class ContentModule {}
