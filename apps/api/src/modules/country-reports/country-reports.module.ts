import { Module } from '@nestjs/common';
import { CountryReportsController } from './country-reports.controller';
import { CountryReportsService } from './country-reports.service';

@Module({
  controllers: [CountryReportsController],
  providers: [CountryReportsService],
  exports: [CountryReportsService],
})
export class CountryReportsModule {}
