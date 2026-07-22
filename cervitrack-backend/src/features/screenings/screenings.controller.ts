import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ScreeningsService } from './screenings.service';
import { CreateScreeningDto, SyncBatchDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('screenings')
@UseGuards(JwtAuthGuard)
export class ScreeningsController {
  constructor(private screeningsService: ScreeningsService) {}

  @Get()
  findAll(
    @Query('facilityId') facilityId?: string,
    @Query('patientId') patientId?: string,
    @Query('result') result?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.screeningsService.findAll({ facilityId, patientId, result, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.screeningsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateScreeningDto) {
    return this.screeningsService.create(dto);
  }

  @Post('sync-batch')
  syncBatch(@Body() dto: SyncBatchDto) {
    return this.screeningsService.syncBatch(dto);
  }
}
