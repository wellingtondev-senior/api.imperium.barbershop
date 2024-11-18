import { Controller, Get, Param, Version, UseGuards, HttpCode } from '@nestjs/common';
import { SessionHashService } from './session-hash.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { validateSessionHashSuccessResponse } from './session-hash.swagger';

@ApiTags('Session Hash')
@Controller('session-hash')
export class SessionHashController {
  constructor(private readonly sessionHashService: SessionHashService) {}

  @Version('1')
  @Get(":hash/:userId")
  @ApiOperation({ summary: 'Listar todos os registros sobre a hash de sessão. A hash é gerada pela ação do usuario como registro, refazer login, etc' })
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(validateSessionHashSuccessResponse) 
  validadeHash(
    @Param("hash") hash: string,
    @Param("userId") userId: string
  ) {
    return this.sessionHashService.validadeHash(hash, userId);
  }
}
