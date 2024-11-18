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
