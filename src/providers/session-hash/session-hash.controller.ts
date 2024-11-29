import { Controller, Get, Param, UseGuards, HttpCode } from '@nestjs/common';
import { SessionHashService } from './session-hash.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('session-hash')
@Controller('session-hash')
export class SessionHashController {
  constructor(private readonly sessionHashService: SessionHashService) {}

  @Get('validate/:hash/:userId')
  @ApiOperation({ 
    summary: 'Validar hash de confirmação',
    description: 'Valida uma hash de confirmação de email. Se a hash for válida, o email será confirmado.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Hash validada com sucesso',
    type: Boolean 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Hash inválida ou expirada' 
  })
  @HttpCode(200)
  async validateHash(
    @Param('hash') hash: string,
    @Param('userId') userId: number,
  ): Promise<boolean> {
    return this.sessionHashService.validateHash(hash, userId);
  }
}
