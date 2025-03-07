import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ProfessionalDto } from './dto/professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../enums/role.enum';
import { CredenciaisService } from '../../modulos/credenciais/credenciais.service';

@Injectable()
export class ProfessionalService {
  private className: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerCustomService,
    private readonly sessionHashService: SessionHashService,
    private readonly mailerService: MailerService,
    private readonly credenciaisService: CredenciaisService
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
                mondayStart: professionalDto.workingHours.mondayStart,
                mondayEnd: professionalDto.workingHours.mondayEnd,
                tuesdayStart: professionalDto.workingHours.tuesdayStart,
                tuesdayEnd: professionalDto.workingHours.tuesdayEnd,
                wednesdayStart: professionalDto.workingHours.wednesdayStart,
                wednesdayEnd: professionalDto.workingHours.wednesdayEnd,
                thursdayStart: professionalDto.workingHours.thursdayStart,
                thursdayEnd: professionalDto.workingHours.thursdayEnd,
                fridayStart: professionalDto.workingHours.fridayStart,
                fridayEnd: professionalDto.workingHours.fridayEnd,
                saturdayStart: professionalDto.workingHours.saturdayStart,
                saturdayEnd: professionalDto.workingHours.saturdayEnd,
                sundayStart: professionalDto.workingHours.sundayStart,
                sundayEnd: professionalDto.workingHours.sundayEnd
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
        message: `Erro ao criar profissional: ${error.message}`
      });

      // Se já for um HttpException, apenas repassa
      if (error instanceof HttpException) {
        throw error;
      }

      // Tratamento específico para erros de unique constraint
      if (error.code === 'P2002') {
        const field = error.meta?.target[0];
        throw new HttpException({
          statusCode: HttpStatus.CONFLICT,
          message: 'Dados duplicados',
          error: `O campo ${field} já está sendo utilizado por outro profissional. Por favor, utilize outro valor.`
        }, HttpStatus.CONFLICT);
      }

      // Tratamento específico para erros de email
      if (error.message.toLowerCase().includes('email')) {
        throw new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email inválido',
          error: 'O endereço de email fornecido é inválido ou já está em uso. Por favor, verifique e tente novamente.'
        }, HttpStatus.BAD_REQUEST);
      }

      // Erro genérico
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro interno',
        error: 'Ocorreu um erro ao criar o profissional. Por favor, tente novamente mais tarde.'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
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
        message: `Erro ao buscar profissional: ${error.message}`
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Profissional não encontrado',
        error: `Não foi possível encontrar um profissional com o ID ${id}. Verifique se o ID está correto e tente novamente.`
      }, HttpStatus.NOT_FOUND);
    }
  }

  async update(id: number, professionalDto: UpdateProfessionalDto) {
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
                  mondayStart: professionalDto.workingHours.mondayStart,
                  mondayEnd: professionalDto.workingHours.mondayEnd,
                  tuesdayStart: professionalDto.workingHours.tuesdayStart,
                  tuesdayEnd: professionalDto.workingHours.tuesdayEnd,
                  wednesdayStart: professionalDto.workingHours.wednesdayStart,
                  wednesdayEnd: professionalDto.workingHours.wednesdayEnd,
                  thursdayStart: professionalDto.workingHours.thursdayStart,
                  thursdayEnd: professionalDto.workingHours.thursdayEnd,
                  fridayStart: professionalDto.workingHours.fridayStart,
                  fridayEnd: professionalDto.workingHours.fridayEnd,
                  saturdayStart: professionalDto.workingHours.saturdayStart,
                  saturdayEnd: professionalDto.workingHours.saturdayEnd,
                  sundayStart: professionalDto.workingHours.sundayStart,
                  sundayEnd: professionalDto.workingHours.sundayEnd
                },
                update: {
                  mondayStart: professionalDto.workingHours.mondayStart,
                  mondayEnd: professionalDto.workingHours.mondayEnd,
                  tuesdayStart: professionalDto.workingHours.tuesdayStart,
                  tuesdayEnd: professionalDto.workingHours.tuesdayEnd,
                  wednesdayStart: professionalDto.workingHours.wednesdayStart,
                  wednesdayEnd: professionalDto.workingHours.wednesdayEnd,
                  thursdayStart: professionalDto.workingHours.thursdayStart,
                  thursdayEnd: professionalDto.workingHours.thursdayEnd,
                  fridayStart: professionalDto.workingHours.fridayStart,
                  fridayEnd: professionalDto.workingHours.fridayEnd,
                  saturdayStart: professionalDto.workingHours.saturdayStart,
                  saturdayEnd: professionalDto.workingHours.saturdayEnd,
                  sundayStart: professionalDto.workingHours.sundayStart,
                  sundayEnd: professionalDto.workingHours.sundayEnd
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
        message: `Erro ao atualizar profissional: ${error.message}`
      });

      if (error instanceof HttpException) {
        throw error;
      }

      // Tratamento específico para erros de unique constraint
      if (error.code === 'P2002') {
        const field = error.meta?.target[0];
        throw new HttpException({
          statusCode: HttpStatus.CONFLICT,
          message: 'Dados duplicados',
          error: `O campo ${field} já está sendo utilizado por outro profissional. Por favor, utilize outro valor.`
        }, HttpStatus.CONFLICT);
      }

      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro ao atualizar',
        error: 'Ocorreu um erro ao atualizar o profissional. Por favor, tente novamente mais tarde.'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(profissionalId: number, adminUserId: number) {
    try {
      // 0. Verificar se o profissional existe
      const professional = await this.prismaService.professional.findUnique({
        where: { id: profissionalId },
        include: {
          user: true,
          workingHours: true,
          socialMedia: true,
          services: true
        }
      });

      if (!professional) {
        throw new HttpException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Profissional com ID ${profissionalId} não encontrado`
        }, HttpStatus.NOT_FOUND);
      }

      // 1. Verificar se o admin existe
      const admin = await this.prismaService.adm.findFirst({
        where: { userId: adminUserId }
      });

      if (!admin) {
        throw new HttpException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Administrador não encontrado`
        }, HttpStatus.NOT_FOUND);
      }

      // 2. Verificar e tratar agendamentos existentes
      const hasSchedules = await this.prismaService.schedule.findFirst({
        where: { professionalId: profissionalId }
      });

      if (hasSchedules) {
        const updatedProfessional = await this.prismaService.professional.update({
          where: { id: profissionalId },
          data: {
            status: 'inactive',
            isAvailable: false
          }
        });

        this.loggerService.log({
          className: this.className,
          functionName: 'remove',
          message: `Profissional com ID ${profissionalId} marcado como inativo devido a agendamentos existentes. Ação realizada pelo admin ${admin.name}`
        });

        return {
          statusCode: HttpStatus.OK,
          message: "Profissional marcado como inativo devido a agendamentos existentes",
          data: updatedProfessional
        };
      }

      // 3. Deletar em ordem para evitar problemas de chave estrangeira
      await this.prismaService.$transaction(async (prisma) => {
        // 3.1 Deletar serviços
        await prisma.service.deleteMany({
          where: { professionalId: profissionalId }
        });

        // 3.2 Deletar horários de trabalho
        await prisma.workingHours.deleteMany({
          where: { professionalId: profissionalId }
        });

        // 3.3 Deletar mídias sociais
        await prisma.socialMedia.deleteMany({
          where: { professionalId: profissionalId }
        });

        // 3.4 Deletar o profissional
        await prisma.professional.delete({
          where: { id: profissionalId }
        });

        // 3.5 Deletar credenciais do profissional
        if (professional.userId) {
          await this.credenciaisService.delete(professional.userId);
        }

        // 3.6 Por último, deletar o usuário do profissional
        if (professional.userId) {
          await prisma.user.delete({
            where: { id: professional.userId }
          });
        }
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'remove',
        message: `Profissional com ID ${profissionalId} excluído com sucesso pelo admin ${admin.name}`
      });

      return {
        statusCode: HttpStatus.OK,
        message: "Profissional excluído com sucesso",
        data: professional
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'remove',
        message: `Erro ao deletar profissional: ${error.message}`
      });

      if (error instanceof HttpException) {
        throw error;
      }

      if (error.code === 'P2003') {
        throw new HttpException({
          statusCode: HttpStatus.CONFLICT,
          message: "Não foi possível excluir o profissional",
          error: "Existem registros vinculados que precisam ser removidos primeiro"
        }, HttpStatus.CONFLICT);
      }

      throw new HttpException({
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message: "Erro ao excluir profissional",
        error: "Ocorreu um erro ao tentar excluir o profissional. Por favor, tente novamente."
      }, HttpStatus.NOT_ACCEPTABLE);
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
        message: `Erro ao buscar profissional por email: ${error.message}`
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Profissional não encontrado',
        error: `Não foi possível encontrar um profissional com o email ${email}. Verifique se o email está correto e tente novamente.`
      }, HttpStatus.NOT_FOUND);
    }
  }
}