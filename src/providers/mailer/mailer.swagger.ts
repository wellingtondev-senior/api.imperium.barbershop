import { ApiResponseOptions } from '@nestjs/swagger';

export const MailerTesteSuccessResponse: ApiResponseOptions = {
  status: 200,
  description: 'criado com sucesso.',
  schema: {
    example: {
        statusCode: 200,
        message: "Email enviado com sucesso"
    }
  },
};

export const MailerConfirmationRegisterEmailResponse = {
  status: 200,
  description: 'E-mail de confirmação enviado com sucesso',
  schema: {
    type: 'object',
    properties: {
      statusCode: {
        type: 'number',
        example: 200,
      },
      message: {
        type: 'string',
        example: 'E-mail de confirmação enviado com sucesso',
      },
    },
  },
};
