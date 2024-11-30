import { Controller, UseGuards, Post, Req, Res, Body, HttpCode, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Version } from '@nestjs/common/decorators/core/version.decorator';
import { ApiOperation, ApiBody, ApiParam, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthDto, AuthForgotDto } from './dto/auth.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import {  AuthSuccessResponse, UnauthorizedResponse } from './auth.swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {

    }

    @Version('1')
    @Post("login")
    @ApiOperation({ summary: 'Authenticação de usuário baseado em Token JWT' })
    @ApiBody({ description: 'Objeto JSON contendo dados', type: AuthDto })
    @HttpCode(202)
    @ApiResponse(AuthSuccessResponse)
    @ApiResponse(UnauthorizedResponse)
    @UseGuards(AuthGuard) // return em booleano
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
    ) {
        return await this.authService.authentication(email, password)
    }




}

