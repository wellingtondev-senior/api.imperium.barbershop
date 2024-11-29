import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import * as crypto from 'crypto';

/**
 * Service responsible for managing session hashes and user validation processes
 * @class SessionHashService
 */
@Injectable()
export class SessionHashService {
  private className: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerCustomService,
  ) {
    this.className = this.constructor.name;
  }

  /**
   * Cria uma nova hash
   * @returns Hash gerada
   */
  private async createHash(): Promise<string> {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Valida uma hash existente
   * @param hash - Hash para validar
   * @param email - Email do usuário
   * @returns true se a hash for válida, false caso contrário
   */
  async validateHash(hash: string, userId: number): Promise<boolean> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id:userId }
      });
      const hashFind = await this.prismaService.sessionHash.findFirst({
        where: {
          hash,
          email:user.email
        }
      });

      if (!hashFind) {
        return false;
      }

      const now = new Date();
      const isExpired = hashFind.validate < now;

      if (isExpired) {
        // Se expirou, atualiza com nova hash
        const newHash = await this.createHash();
        await this.prismaService.sessionHash.update({
          where: { id: hashFind.id },
          data: {
            hash: newHash,
            validate: this.addMinutesToCurrentTime(60)
          }
        });
        return false;
      }

      // Se a hash for válida, atualiza o usuário para ativo
      await this.prismaService.user.update({
        where: { email: user.email },
        data: { active: true }
      });

      // Remove a hash após validação bem-sucedida
      await this.prismaService.sessionHash.delete({
        where: { id: hashFind.id }
      });

      return true;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'validateHash',
        message: `Erro ao validar hash  ${hash}`,
        context: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        }
      });
      throw new HttpException(
        'Erro ao validar hash',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Gera uma nova hash para confirmação de email
   * @param email - Email do usuário
   * @returns Hash gerada
   */
  async generateHashAuthentication(email: string): Promise<string> {
    try {
      // Verifica se já existe uma hash para este email
      const existingHash = await this.prismaService.sessionHash.findFirst({
        where: { email }
      });

      if (existingHash) {
        const now = new Date();
        const isValid = existingHash.validate > now;

        if (isValid) {
          return existingHash.hash;
        }

        // Se expirou, atualiza com nova hash
        const newHash = await this.createHash();
        const updated = await this.prismaService.sessionHash.update({
          where: { id: existingHash.id },
          data: {
            hash: newHash,
            validate: this.addMinutesToCurrentTime(60)
          }
        });
        return updated.hash;
      }

      // Se não existe, cria uma nova
      const newHash = await this.createHash();
      const created = await this.prismaService.sessionHash.create({
        data: {
          hash: newHash,
          email,
          validate: this.addMinutesToCurrentTime(60)
        }
      });

      return created.hash;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'generateHashAuthentication',
        message: `Erro ao gerar hash para email ${email}`,
        context: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        }
      });
      throw new HttpException(
        'Erro ao gerar hash de confirmação',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Adiciona minutos ao tempo atual
   * @param minutes - Número de minutos para adicionar
   * @returns Data com os minutos adicionados
   */
  private addMinutesToCurrentTime(minutes: number): Date {
    const date = new Date();
    return new Date(date.getTime() + minutes * 60000);
  }
}
