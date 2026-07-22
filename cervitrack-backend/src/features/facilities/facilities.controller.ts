import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators';

@Controller('facilities')
@UseGuards(JwtAuthGuard)
export class FacilitiesController {
  constructor(private facilitiesService: FacilitiesService) {}

  @Get()
  findAll(
    @Query('county') county?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.facilitiesService.findAll({ county, type, search, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facilitiesService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.facilitiesService.getStats(id);
  }

  @Post()
  @Roles('county_admin', 'national_admin', 'system_admin')
  create(@Body() body: any) {
    return this.facilitiesService.create(body);
  }

  @Put(':id')
  @Roles('county_admin', 'national_admin', 'system_admin')
  update(@Param('id') id: string, @Body() body: any) {
    return this.facilitiesService.update(id, body);
  }
}
