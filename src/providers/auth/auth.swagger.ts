import { ApiResponseOptions } from '@nestjs/swagger';
import { Role } from 'src/enums/role.enum';

export const AuthSuccessResponse: ApiResponseOptions = {
  status: 202,
  description: 'Sucesso na autenticação.',
  schema: {
    example: {
      
        statusCode: 202,
        message: {
            id: 0,
            email: "email@email.com",
            role: "FANS",
            active: true,
            access_token: "Bearer",
            user: [
              {
                name:"nome do usuario",
                cpf:"12345678901",
                email: "email@email.com",
              }
            ]
        
    }
    },
  },
};

export const BadRequestResponse: ApiResponseOptions = {
  status: 400,
  description: 'Requisição inválida.',
  schema: {
    example: {
      statusCode: 400,
      message: 'Token de acesso inválido',
      error: 'Bad Request',
    },
  },
};

export const UnauthorizedResponse: ApiResponseOptions = {
  status: 403,
  description: 'Acesso não autorizado.',
  schema: {
    example: {
      statusCode: 403,
      message: 'Token expirado ',
    },
  },
};
