import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { listGamesQuerySchema } from '@props-analyzer/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { GamesService } from './games.service.js';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'List completed games, optionally filtered' })
  findAll(
    @Query(new ZodValidationPipe(listGamesQuerySchema))
    query: ReturnType<typeof listGamesQuerySchema.parse>
  ) {
    return this.gamesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single game by id' })
  findOne(@Param('id') id: string) {
    return this.gamesService.findById(id);
  }

  @Get(':id/players')
  @ApiOperation({ summary: 'Box score for a game (both teams)' })
  findBoxScore(@Param('id') id: string) {
    return this.gamesService.findBoxScore(id);
  }
}
