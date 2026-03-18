import { Module } from '@nestjs/common';
import { YouthIndexController } from './youth-index.controller';
import { YouthIndexService } from './youth-index.service';

@Module({
  controllers: [YouthIndexController],
  providers: [YouthIndexService],
  exports: [YouthIndexService],
})
export class YouthIndexModule {}
