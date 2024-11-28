import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../decorator/roles.decorator';
import { Role } from '../../enums/role.enum';
import { RoleGuard } from '../../guards/role.guard';
import { MailerConfirmationRegisterEmailDto, MailerTesteEmailDto } from './dto/mailer.dto';
import { MailerTesteSuccessResponse, MailerConfirmationRegisterEmailResponse } from './mailer.swagger';

@ApiTags('Mailer responsavel por enviar e-mail')
@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Version('1')
  @Post("teste")
  @ApiOperation({ summary: 'Send test email' })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(MailerTesteSuccessResponse) 
  sendEmailTeste(@Body() emailDto: MailerTesteEmailDto) {
    return this.mailerService.sendEmailTeste(emailDto);
  }

  @Version('1')
  @Post("confirm-register")
  @ApiOperation({ summary: 'Send confirmation register email' })
  async sendEmailConfirmRegister(@Body() emailDto: MailerConfirmationRegisterEmailDto) {
    return await this.mailerService.sendEmailConfirmRegister(emailDto);
  }
}
