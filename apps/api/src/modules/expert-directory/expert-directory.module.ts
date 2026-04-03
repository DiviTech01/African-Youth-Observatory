import { Module } from '@nestjs/common';
import { ExpertDirectoryController } from './expert-directory.controller';
import { ExpertDirectoryService } from './expert-directory.service';

@Module({
  controllers: [ExpertDirectoryController],
  providers: [ExpertDirectoryService],
  exports: [ExpertDirectoryService],
})
export class ExpertDirectoryModule {}
