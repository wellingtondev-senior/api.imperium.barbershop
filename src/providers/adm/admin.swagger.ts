import { ApiResponseOptions } from '@nestjs/swagger';

export const AdminSuccessResponse: ApiResponseOptions = {
  status: 202,
  description: 'criado com sucesso.',
  schema: {
    example: {
        statusCode: 202,
        message: {
            email: "wrm@gmail.com",
            create_at: "2024-10-11T15:53:44.185Z",
            update_at: "2024-10-11T15:53:44.185Z",
            role: "ADM",
            active: false,
            user: [
                {
                    id: 5,
                    name: "wellington",
                    email: "wrm@gmail.com",
                    cpf: "11123467800",
                    create_at: "2024-10-11T15:53:44.185Z",
                    update_at: "2024-10-11T15:53:44.185Z",
                    userId: 7
                }
            ]
        }
    }
  },
};
