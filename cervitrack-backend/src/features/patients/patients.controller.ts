import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  findAll(
    @Query('county') county?: string,
    @Query('facilityId') facilityId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.patientsService.findAll({ county, facilityId, search, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.patientsService.getSummary(id);
  }

  @Post()
  @Roles('facility_admin', 'clinician', 'system_admin')
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Put(':id')
  @Roles('facility_admin', 'clinician', 'system_admin')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }
}
