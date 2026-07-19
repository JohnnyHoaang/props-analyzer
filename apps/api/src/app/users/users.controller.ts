import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'The current user',
    description:
      'Authentication is deferred in Phase 1 — this always returns the single stubbed user.',
  })
  getCurrentUser() {
    return this.usersService.getCurrentUser();
  }
}
