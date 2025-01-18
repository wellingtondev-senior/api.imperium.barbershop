export interface AppointmentConfirmationDto {
  to: string;
  context: {
    clientName: string;
    appointmentDate: Date;
    barberName: string;
    services: string[];
  };
}

export interface AppointmentReminderDto {
  to: string;
  context: {
    clientName: string;
    appointmentDate: Date;
    barberName: string;
  };
}

export interface AppointmentCancellationDto {
  to: string;
  context: {
    clientName: string;
    appointmentDate: Date;
  };
}

export interface PromotionalMessageDto {
  to: string;
  context: {
    promoText: string;
    imageUrl?: string;
  };
}
