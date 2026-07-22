import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('telemetry')
@UseGuards(JwtAuthGuard)
export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  @Post('record')
  recordMetric(@Body() body: {
    userId: string;
    metricType: string;
    value: number;
    unit?: string;
    source: string;
    metadata?: Record<string, any>;
  }) {
    return this.telemetryService.recordMetric(body);
  }

  @Get('metrics')
  getMetrics(
    @Query('userId') userId?: string,
    @Query('metricType') metricType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.telemetryService.getMetrics({ userId, metricType, startDate, endDate, limit });
  }

  @Get('aggregates')
  getAggregates(
    @Query('metricType') metricType: string,
    @Query('period') period: string,
  ) {
    return this.telemetryService.getAggregates(metricType, period);
  }
}
