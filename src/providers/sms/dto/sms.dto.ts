import { IsString, IsNotEmpty, IsMobilePhone } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SMSDto {
    @ApiProperty({
        description: 'Número de telefone para envio do SMS',
        example: '+5511999999999'
    })
    @IsString()
    @IsNotEmpty()
    to: string;

    @ApiProperty({
        description: 'Mensagem a ser enviada',
        example: 'Sua mensagem aqui'
    })
    @IsString()
    @IsNotEmpty()
    message: string;
}

// Alias for backward compatibility
export default SMSDto 
