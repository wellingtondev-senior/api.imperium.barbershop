import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { MailerConfirmationRegisterEmailDto, MailerTesteEmailDto } from './dto/mailer.dto';
import { MailerTesteSuccessResponse, MailerConfirmationRegisterEmailResponse } from './mailer.swagger';
import { SessionHashService } from './session-hash.service';

@ApiTags('Mailer responsavel por enviar e-mail')
@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService, private readonly sessionHashService: SessionHashService) {}

  @Version('1')
  @Post("teste")
  @ApiOperation({ summary: 'Enviar e-mail de teste' })
  @ApiBody({description: 'Objeto JSON contendo dados', type: MailerTesteEmailDto })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(MailerTesteSuccessResponse) 
  sendEmailTeste(@Body() createInstallDto: MailerTesteEmailDto) {
    return this.mailerService.sendEmailTeste(createInstallDto);
  }
  @Version('1')
  @Post("confirm-register")
  @ApiOperation({ summary: 'Send confirmation register email' })
  async sendEmailConfirmRegister(
    @Body() body: MailerConfirmationRegisterEmailDto,
  ) {
    const { hash, codigo } = await this.sessionHashService.generateHash(body.context.email);
    return this.mailerService.sendEmailConfirmRegister({
      ...body,
      context: {
        ...body.context,
        hash,
        codigo
      }
    });
  }
}
