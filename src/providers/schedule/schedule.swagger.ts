import { ApiResponseOptions } from '@nestjs/swagger';

export const ScheduleCreateSuccessResponse: ApiResponseOptions = {
  status: 201,
  description: 'Agendamento criado com sucesso',
  schema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Agendamento realizado com sucesso',
      },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          date: { type: 'string', example: '2024-01-20T10:00:00Z' },
          status: { type: 'string', example: 'pending' },
          notes: { type: 'string', example: 'Observação do agendamento' },
          professional: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'João Barbeiro' },
            },
          },
          client: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Maria Cliente' },
              email: { type: 'string', example: 'maria@email.com' },
              phone: { type: 'string', example: '11999999999' },
            },
          },
          services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'Corte de Cabelo' },
                price: { type: 'number', example: 50.00 },
              },
            },
          },
          payment: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              amount: { type: 'number', example: 50.00 },
              status: { type: 'string', example: 'pending' },
              method: { type: 'string', example: 'card' },
            },
          },
          create_at: { type: 'string', example: '2024-01-19T14:00:00Z' },
          update_at: { type: 'string', example: '2024-01-19T14:00:00Z' },
        },
      },
    },
  },
};

export const ScheduleListSuccessResponse: ApiResponseOptions = {
  status: 200,
  description: 'Lista de agendamentos retornada com sucesso',
  schema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            date: { type: 'string', example: '2024-01-20T10:00:00Z' },
            status: { type: 'string', example: 'pending' },
            professional: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'João Barbeiro' },
              },
            },
            client: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Maria Cliente' },
                email: { type: 'string', example: 'maria@email.com' },
              },
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Corte de Cabelo' },
                  price: { type: 'number', example: 50.00 },
                },
              },
            },
          },
        },
      },
      total: { type: 'number', example: 10 },
      page: { type: 'number', example: 1 },
      totalPages: { type: 'number', example: 2 },
    },
  },
};

export const ScheduleUpdateSuccessResponse: ApiResponseOptions = {
  status: 200,
  description: 'Agendamento atualizado com sucesso',
  schema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Status do agendamento atualizado com sucesso',
      },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          status: { type: 'string', example: 'confirmed' },
          update_at: { type: 'string', example: '2024-01-19T14:00:00Z' },
        },
      },
    },
  },
};

export const ScheduleErrorResponse: ApiResponseOptions = {
  status: 400,
  description: 'Erro ao processar a requisição',
  schema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      message: {
        type: 'string',
        example: 'Erro ao realizar agendamento',
      },
      error: {
        type: 'string',
        example: 'Horário indisponível',
      },
    },
  },
};
