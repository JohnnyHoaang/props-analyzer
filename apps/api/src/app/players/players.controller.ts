import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  listPlayersQuerySchema,
  playerGameLogQuerySchema,
} from '@props-analyzer/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PlayersService } from './players.service.js';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @ApiOperation({ summary: 'List players, optionally filtered by team/position' })
  findAll(
    @Query(new ZodValidationPipe(listPlayersQuerySchema))
    query: ReturnType<typeof listPlayersQuerySchema.parse>
  ) {
    return this.playersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single player by id' })
  findOne(@Param('id') id: string) {
    return this.playersService.findById(id);
  }

  @Get(':id/game-log')
  @ApiOperation({ summary: "A player's most recent completed games" })
  findGameLog(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(playerGameLogQuerySchema))
    query: ReturnType<typeof playerGameLogQuerySchema.parse>
  ) {
    return this.playersService.findGameLog(id, query);
  }

  @Get(':id/props')
  @ApiOperation({
    summary: "A player's prop markets, each with its per-game series",
  })
  findProps(@Param('id') id: string) {
    return this.playersService.findProps(id);
  }
}
