import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ProfessionalDto } from './dto/professional.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../enums/role.enum';

@Injectable()
export class ProfessionalService {
  private className: string;
  
  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerCustomService,
    private readonly sessionHashService: SessionHashService,
    private readonly mailerService: MailerService
  ) {
    this.className = this.constructor.name;
  }

  async create(professionalDto: ProfessionalDto) {
    try {
      const passCrypt = await bcrypt.hash(professionalDto.password, 10);

      const findProfessional = await this.prismaService.professional.findMany({
        where: {
          email: professionalDto.email
        }
      });

      if (findProfessional.length > 0) {
        throw new HttpException({
          statusCode: HttpStatus.CONFLICT,
          message: 'Profissional já cadastrado',
          error: `O profissional com o email ${professionalDto.email} já está cadastrado no sistema. Por favor, utilize outro email ou faça login.`
        }, HttpStatus.CONFLICT);
      }

      const createUser = await this.prismaService.user.create({
        data: {
          email: professionalDto.email,
          password: passCrypt,
          role: Role.PROFESSIONAL,
          name: professionalDto.name
        }
      });

      const createProfessional = await this.prismaService.professional.create({
        data: {
          name: professionalDto.name,
          email: professionalDto.email,
          phone: professionalDto.phone,
          password: passCrypt,
          document: professionalDto.document,
          type_doc: professionalDto.type_doc,
          cpf: professionalDto.cpf,
          avatarUrl: professionalDto.avatarUrl,
          imageUrl: professionalDto.imageUrl,
          experienceYears: professionalDto.experienceYears,
          specialties: professionalDto.specialties || [],
          rating: professionalDto.rating,
          location: professionalDto.location,
          bio: professionalDto.bio,
          isAvailable: professionalDto.isAvailable ?? true,
          status: professionalDto.status || 'active',
          availability: professionalDto.availability,
          user: {
            connect: {
              id: createUser.id
            }
          },
          ...(professionalDto.workingHours && {
            workingHours: {
              create: {
                mondayStart: professionalDto.workingHours.monday?.start,
                mondayEnd: professionalDto.workingHours.monday?.end,
                tuesdayStart: professionalDto.workingHours.tuesday?.start,
                tuesdayEnd: professionalDto.workingHours.tuesday?.end,
                wednesdayStart: professionalDto.workingHours.wednesday?.start,
                wednesdayEnd: professionalDto.workingHours.wednesday?.end,
                thursdayStart: professionalDto.workingHours.thursday?.start,
                thursdayEnd: professionalDto.workingHours.thursday?.end,
                fridayStart: professionalDto.workingHours.friday?.start,
                fridayEnd: professionalDto.workingHours.friday?.end,
                saturdayStart: professionalDto.workingHours.saturday?.start,
                saturdayEnd: professionalDto.workingHours.saturday?.end,
                sundayStart: professionalDto.workingHours.sunday?.start,
                sundayEnd: professionalDto.workingHours.sunday?.end
              }
            }
          }),
          ...(professionalDto.socialMedia && {
            socialMedia: {
              create: {
                instagram: professionalDto.socialMedia.instagram,
                facebook: professionalDto.socialMedia.facebook,
                twitter: professionalDto.socialMedia.twitter,
                linkedin: professionalDto.socialMedia.linkedin
              }
            }
          })
        }
      });

      await this.prismaService.credenciais.create({
        data: {
          email: professionalDto.email,
          password: passCrypt,
          userId: createUser.id,
        },
      });

      const result = await this.prismaService.professional.findUnique({
        where: { id: createProfessional.id },
        include: {
          user: true,
          workingHours: true,
          socialMedia: true
        }
      });

      // Gerar hash para confirmação de email
      const hash = await this.sessionHashService.generateHashAuthentication(result.email);

      // Enviar email de confirmação
      await this.mailerService.sendEmailConfirmRegister({
        to: result.email,
        subject: 'Confirmação de Registro',
        template: 'confirmation-register',
        context: {
          name: result.name,
          email: result.email,
          hash
        }
      });

      return {
        statusCode: HttpStatus.ACCEPTED,
        message: {
          email: professionalDto.email,
          create_at: createProfessional.create_at,
          update_at: createProfessional.update_at,
          role: createUser.role,
          active: createUser.active,
          user: [createProfessional]
        }
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'create',
        message: `Error creating professional: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findAll() {
    try {
      const professionals = await this.prismaService.professional.findMany({
        include: {
          user: true,
          workingHours: true,
          socialMedia: true,
          services: true
        }
      });
      return {
        statusCode: HttpStatus.OK,
        message: professionals
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findAll',
        message: `Error fetching professionals: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findOne(id: number) {
    try {
      const professional = await this.prismaService.professional.findUnique({
        where: { id },
        include: {
          user: true,
          workingHours: true,
          socialMedia: true,
          services: true
        }
      });
      if (!professional) {
        throw new Error(`Professional with ID ${id} not found`);
      }
      return {
        statusCode: HttpStatus.OK,
        message: professional
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findOne',
        message: `Error fetching professional: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async update(id: number, professionalDto: ProfessionalDto) {
    try {
      const professional = await this.prismaService.professional.update({
        where: { id },
        data: {
          name: professionalDto.name,
          email: professionalDto.email,
          phone: professionalDto.phone,
          document: professionalDto.document,
          type_doc: professionalDto.type_doc,
          avatarUrl: professionalDto.avatarUrl,
          imageUrl: professionalDto.imageUrl,
          cpf: professionalDto.cpf,
          experienceYears: professionalDto.experienceYears,
          specialties: professionalDto.specialties,
          rating: professionalDto.rating,
          location: professionalDto.location,
          bio: professionalDto.bio,
          isAvailable: professionalDto.isAvailable,
          status: professionalDto.status,
          availability: professionalDto.availability,
          ...(professionalDto.workingHours && {
            workingHours: {
              upsert: {
                create: {
                  mondayStart: professionalDto.workingHours.monday?.start,
                  mondayEnd: professionalDto.workingHours.monday?.end,
                  tuesdayStart: professionalDto.workingHours.tuesday?.start,
                  tuesdayEnd: professionalDto.workingHours.tuesday?.end,
                  wednesdayStart: professionalDto.workingHours.wednesday?.start,
                  wednesdayEnd: professionalDto.workingHours.wednesday?.end,
                  thursdayStart: professionalDto.workingHours.thursday?.start,
                  thursdayEnd: professionalDto.workingHours.thursday?.end,
                  fridayStart: professionalDto.workingHours.friday?.start,
                  fridayEnd: professionalDto.workingHours.friday?.end,
                  saturdayStart: professionalDto.workingHours.saturday?.start,
                  saturdayEnd: professionalDto.workingHours.saturday?.end,
                  sundayStart: professionalDto.workingHours.sunday?.start,
                  sundayEnd: professionalDto.workingHours.sunday?.end
                },
                update: {
                  mondayStart: professionalDto.workingHours.monday?.start,
                  mondayEnd: professionalDto.workingHours.monday?.end,
                  tuesdayStart: professionalDto.workingHours.tuesday?.start,
                  tuesdayEnd: professionalDto.workingHours.tuesday?.end,
                  wednesdayStart: professionalDto.workingHours.wednesday?.start,
                  wednesdayEnd: professionalDto.workingHours.wednesday?.end,
                  thursdayStart: professionalDto.workingHours.thursday?.start,
                  thursdayEnd: professionalDto.workingHours.thursday?.end,
                  fridayStart: professionalDto.workingHours.friday?.start,
                  fridayEnd: professionalDto.workingHours.friday?.end,
                  saturdayStart: professionalDto.workingHours.saturday?.start,
                  saturdayEnd: professionalDto.workingHours.saturday?.end,
                  sundayStart: professionalDto.workingHours.sunday?.start,
                  sundayEnd: professionalDto.workingHours.sunday?.end
                }
              }
            }
          }),
          ...(professionalDto.socialMedia && {
            socialMedia: {
              upsert: {
                create: {
                  instagram: professionalDto.socialMedia.instagram,
                  facebook: professionalDto.socialMedia.facebook,
                  twitter: professionalDto.socialMedia.twitter,
                  linkedin: professionalDto.socialMedia.linkedin
                },
                update: {
                  instagram: professionalDto.socialMedia.instagram,
                  facebook: professionalDto.socialMedia.facebook,
                  twitter: professionalDto.socialMedia.twitter,
                  linkedin: professionalDto.socialMedia.linkedin
                }
              }
            }
          })
        },
        include: {
          workingHours: true,
          socialMedia: true,
          services: true
        }
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'update',
        message: `Updated professional with ID: ${professional.id}`
      });
      
      return {
        statusCode: HttpStatus.OK,
        message: professional
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'update',
        message: `Error updating professional: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async remove(id: number) {
    try {
      // Primeiro, excluir registros relacionados
      await this.prismaService.workingHours.deleteMany({
        where: { professionalId: id }
      });
      
      await this.prismaService.socialMedia.deleteMany({
        where: { professionalId: id }
      });

      // Verificar e tratar agendamentos existentes
      const hasSchedules = await this.prismaService.schedule.findFirst({
        where: { professionalId: id }
      });

      if (hasSchedules) {
        // Em vez de excluir, marcar como inativo
        const professional = await this.prismaService.professional.update({
          where: { id },
          data: {
            status: 'inactive',
            isAvailable: false
          }
        });

        this.loggerService.log({
          className: this.className,
          functionName: 'remove',
          message: `Professional with ID ${id} marked as inactive due to existing schedules`
        });

        return {
          statusCode: HttpStatus.OK,
          message: "Professional marked as inactive due to existing schedules"
        };
      }

      const professional = await this.prismaService.professional.delete({
        where: { id }
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'remove',
        message: `Deleted professional with ID: ${professional.id}`
      });
      
      return {
        statusCode: HttpStatus.OK,
        message: professional
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'remove',
        message: `Error deleting professional: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findByEmail(email: string) {
    try {
      const professional = await this.prismaService.professional.findUnique({
        where: { email },
        include: {
          user: true,
          workingHours: true,
          socialMedia: true,
          services: true
        }
      });
      return {
        statusCode: HttpStatus.OK,
        message: professional
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findByEmail',
        message: `Error fetching professional by email: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }
}