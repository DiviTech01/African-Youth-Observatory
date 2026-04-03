import { Module } from '@nestjs/common';
import { YouthIndexController } from './youth-index.controller';
import { YouthIndexService } from './youth-index.service';
import { YouthIndexCalculatorService } from './youth-index-calculator.service';

@Module({
  controllers: [YouthIndexController],
  providers: [YouthIndexService, YouthIndexCalculatorService],
  exports: [YouthIndexService, YouthIndexCalculatorService],
})
export class YouthIndexModule {}
