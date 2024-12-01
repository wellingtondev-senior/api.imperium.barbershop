import { ApiResponseOptions } from '@nestjs/swagger';

export const ProfessionalSuccessResponse: ApiResponseOptions = {
  status: 202,
  description: 'Profissional criado com sucesso.',
  schema: {
    example: {
      statusCode: 202,
      message: {
        email: "professional@example.com",
        create_at: "2024-01-01T10:00:00.000Z",
        update_at: "2024-01-01T10:00:00.000Z",
        role: "PROFESSIONAL",
        active: true,
        user: [
          {
            id: 1,
            name: "John Doe",
            email: "professional@example.com",
            cpf: "12345678900",
            create_at: "2024-01-01T10:00:00.000Z",
            update_at: "2024-01-01T10:00:00.000Z",
            userId: 1,
            specialties: ["Barber", "Hair Stylist"],
            workingHours: {
              monday: { start: "09:00", end: "18:00" },
              tuesday: { start: "09:00", end: "18:00" },
              wednesday: { start: "09:00", end: "18:00" },
              thursday: { start: "09:00", end: "18:00" },
              friday: { start: "09:00", end: "18:00" }
            }
          }
        ]
      }
    }
  },
};
export const ProfessionalListSuccessResponse: ApiResponseOptions = {
  status: 202,
  description: 'Profissional criado com sucesso.',
  schema: {
    example: {
      statusCode: 202,
      message: [{
        email: "professional@example.com",
        create_at: "2024-01-01T10:00:00.000Z",
        update_at: "2024-01-01T10:00:00.000Z",
        role: "PROFESSIONAL",
        active: true,
        user: [
          {
            id: 1,
            name: "John Doe",
            email: "professional@example.com",
            cpf: "12345678900",
            create_at: "2024-01-01T10:00:00.000Z",
            update_at: "2024-01-01T10:00:00.000Z",
            userId: 1,
            specialties: ["Barber", "Hair Stylist"],
            workingHours: {
              monday: { start: "09:00", end: "18:00" },
              tuesday: { start: "09:00", end: "18:00" },
              wednesday: { start: "09:00", end: "18:00" },
              thursday: { start: "09:00", end: "18:00" },
              friday: { start: "09:00", end: "18:00" }
            }
          }
        ]
      }
    ]
    }
  },
};
