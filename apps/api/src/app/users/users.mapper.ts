import type { User } from '@props-analyzer/database';
import type { UserDto } from '@props-analyzer/shared-types';

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
