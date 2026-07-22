import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { Dhis2ExporterService } from './dhis2-exporter.service';
import { FacilitiesModule } from '../facilities/facilities.module';

@Module({
  imports: [FacilitiesModule],
  controllers: [ReportsController],
  providers: [Dhis2ExporterService],
})
export class ReportsModule {}
