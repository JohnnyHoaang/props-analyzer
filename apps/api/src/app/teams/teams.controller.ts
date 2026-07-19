import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeamsService } from './teams.service.js';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'List all teams' })
  @ApiOkResponse({ description: 'All teams, sorted by name.' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single team by id' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findById(id);
  }
}
