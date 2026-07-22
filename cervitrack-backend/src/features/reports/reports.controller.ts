import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { Dhis2ExporterService } from './dhis2-exporter.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private dhis2Service: Dhis2ExporterService) {}

  @Get('facility/:id/monthly')
  getFacilityMonthly(
    @Param('id') id: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.dhis2Service.generateMonthlyReport(id, year, month);
  }

  @Post('facility/:id/export-dhis2')
  @Roles('facility_admin', 'county_admin', 'national_admin', 'system_admin')
  exportToDhis2(
    @Param('id') id: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.dhis2Service.exportToDhis2(id, year, month);
  }

  @Get('national/summary')
  @Roles('national_admin', 'system_admin')
  getNationalSummary(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.dhis2Service.getNationalSummary(year, month);
  }
}
