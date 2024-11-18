import { ApiResponseOptions } from '@nestjs/swagger';

export const validateSessionHashSuccessResponse: ApiResponseOptions = {
  status: 200,
  description: 'criado com sucesso.',
  schema: {
    example: {
        statusCode: 200,
        message: {
            hash:"dR673gh5po4",
            valid: true,
            codigo: "123456",
            action: "confirm-register",
        }
    }
  },
};
