import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { MailerConfirmationRegisterEmailDto, MailerTesteEmailDto } from './dto/mailer.dto';
import { MailerTesteSuccessResponse } from './mailer.swagger';


@ApiTags('Mailer responsavel por enviar e-mail')
@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

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
  @Get("confirm-register/:userId")
  @ApiOperation({ summary: 'Enviar e-mail de confirmação de registro' })
  @ApiBody({description: 'Objeto JSON contendo dados', type: MailerConfirmationRegisterEmailDto })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(MailerTesteSuccessResponse) 
  sendEmailConfirmRegister(
    @Param('userId') userId: number,
    @Body('role') role: Role
  ) {
    return this.mailerService.sendEmailConfirmRegister(userId, role);
  }
}
