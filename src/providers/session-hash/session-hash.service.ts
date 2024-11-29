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
   * Creates a new session hash for a user
   * @param userId - The user ID to create the hash for
   * @param action - The action associated with the hash
   * @returns The created session hash object
   */
  async createHash(userId: number, action: string) {
    try {
      // Procura por uma hash existente para o usuário
      const existingHash = await this.prismaService.sessionHash.findFirst({
        where: {
          userId,
          action,
        
        },
      });

      // Se encontrou uma hash existente
      if (existingHash) {
        const now = new Date();
        const isValid = existingHash.validate > now;

        // Se a hash ainda é válida, retorna ela mesma
        if (isValid) {
          this.loggerService.log({
            className: this.className,
            functionName: 'createHash',
            message: `Hash existente ainda válida para usuário ${userId}`,
          });
          return existingHash;
        }

        // Se a hash expirou, gera uma nova e atualiza o registro existente
        const newHash = crypto.randomBytes(32).toString('hex');
        const updatedHash = await this.prismaService.sessionHash.update({
          where: {
            id: existingHash.id,
          },
          data: {
            hash: newHash,
            validate: this.addMinutesToCurrentTime(60),
          },
        });

        this.loggerService.log({
          className: this.className,
          functionName: 'createHash',
          message: `Hash atualizada para usuário ${userId}`,
        });

        return updatedHash;
      }

      // Se não existe hash, cria uma nova
      const hash = crypto.randomBytes(32).toString('hex');
      const sessionHash = await this.prismaService.sessionHash.create({
        data: {
          hash,
          action,
          status: true,
          validate: this.addMinutesToCurrentTime(60),
          userId,
        },
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'createHash',
        message: `Nova hash criada com sucesso para usuário ${userId}`,
      });

      return sessionHash;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'createHash',
        message: `Erro ao criar hash para usuário ${userId}`,
        context: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });

      throw new HttpException(
        'Erro ao criar hash de confirmação',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validates a hash for a specific user
   * @param hash - The hash string to validate
   * @param userId - The user ID associated with the hash
   * @returns Object containing validation status and user information
   * @throws HttpException if validation fails
   */
  async validadeHash(hash: string, userId: string) {
    try {
      // Busca a hash ativa mais recente para o usuário
      const hashFind = await this.prismaService.sessionHash.findFirst({
        where: {
          hash,
          userId: parseInt(userId),
          status: true,
          action: 'confirm-register'
        },
        include: {
          user: true,
        }
      });

      if (!hashFind) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Hash não encontrada',
        };
      }

      const now = new Date();
      const isExpired = hashFind.validate < now;

      // Se o hash está expirado, cria uma nova hash
      if (isExpired) {
        // Desativa a hash atual
        await this.prismaService.sessionHash.update({
          where: {
            id: hashFind.id,
          },
          data: {
            status: false,
          },
        });

        // Cria uma nova hash
        const newHash = await this.createHash(parseInt(userId), 'confirm-register');

        return {
          statusCode: HttpStatus.OK,
          message: {
            hash: newHash.hash,
            valid: true,
            renewed: true,
            validate: newHash.validate,
          },
        };
      }

      // Se o hash é válido, atualiza o status do usuário e invalida o hash
      await this.prismaService.user.update({
        where: {
          id: parseInt(userId)
        },
        data: {
          active: true
        }
      });

      await this.prismaService.sessionHash.update({
        where: {
          id: hashFind.id,
        },
        data: {
          status: false,
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: {
          hash: hashFind.hash,
          valid: true,
          renewed: false,
          validate: hashFind.validate,
        },
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'validadeHash',
        message: `Erro ao validar hash para usuário ${userId}`,
        context: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });

      throw new HttpException(
        'Erro ao validar hash',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generates a new hash for a user
   * @param userId - The user ID to generate the hash for
   * @returns Object containing the generated hash and code
   * @throws HttpException if generation fails
   */
  async generateHash(userId: number): Promise<{ hash: string }> {
    // Desativa qualquer hash existente antes de criar uma nova
    await this.prismaService.sessionHash.updateMany({
      where: {
        userId,
        action: 'confirm-register',
        status: true,
      },
      data: {
        status: false,
      },
    });

    // Cria uma nova hash
    const hash = crypto.randomBytes(32).toString('hex');
    
    await this.prismaService.sessionHash.create({
      data: {
        userId,
        hash,
        validate: this.addMinutesToCurrentTime(60),
        status: true,
        action: 'confirm-register'
      },
    });

    return { hash };
  }

  /**
   * Adds minutes to the current time
   * @param minutes - Number of minutes to add
   * @returns Date object with added minutes
   * @private
   */
  private addMinutesToCurrentTime(minutes: number): Date {
    const date = new Date();
    return new Date(date.getTime() + minutes * 60000);
  }
}
