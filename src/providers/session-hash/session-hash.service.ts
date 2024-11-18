import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
import * as crypto from 'crypto';
import { CreateSessionHashDto } from './dto/session-hash.dto';

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
   * Validates a hash for a specific user
   * @param hash - The hash string to validate
   * @param userId - The user ID associated with the hash
   * @returns Object containing validation status and user information
   * @throws HttpException if validation fails
   */
  async validadeHash(hash: string, userId: string) {
    try {
      const hashFind = await this.prismaService.sessionHash.findFirst({
        where: {
          hash,
          userId: parseInt(userId),
          status: true,
          validate: {
            gt: new Date(),
          },
          action: 'confirm-register'
        },
        include: {
          user: true,
        }
      });

      if (!hashFind) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Hash não encontrado ou estar expirada',
        };
      }

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
          hash: hashFind?.hash,
          valid: true,
        },
      };
      
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'validadeHash',
        message: error.message,
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }  /**
   * Creates a new hash for user registration confirmation
   * @param userId - The user ID for whom to create the hash
   * @returns Object containing the created hash details
   * @throws HttpException if hash creation fails
   */
  async createHashConfirmRegister(userId: number) {
    try {
      // Clean up expired hashes before creating new one
      await this.cleanupExpiredHashes();

      const codigo = this.gerarNumeroAleatorio();
      const hash = this.gerarHash();

      const body: CreateSessionHashDto = {
        userId,
        hash,
        codigo,
        status: true,
        action: 'confirm-register',
        validate: this.addMinutesToCurrentTime(60),
      };

      const createdHash = await this.prismaService.sessionHash.create({
        data: body
      });

      return {
        statusCode: HttpStatus.OK,
        message: {
          ...body,
          id: createdHash.id
        },
      };

    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'createHashConfirmRegister',
        message: error.message,
      });
      throw new HttpException('Erro ao criar o hash', HttpStatus.NOT_ACCEPTABLE);
    }
  }

  /**
   * Finds a hash entry by its hash value
   * @param hash - The hash string to search for
   * @returns Object containing hash details if found, false otherwise
   * @throws HttpException if search fails
   */
  async findByHash(hash: string): Promise<boolean | object> {
    try {
      const hashFind = await this.prismaService.sessionHash.findFirst({
        where: { 
          hash,
          status: true,
          validate: {
            gt: new Date(),
          },
        },
      });

      if (hashFind) {
        return {
          statusCode: HttpStatus.OK,
          message: {
            hash: hashFind.hash,
            valid: true,
            codigo: hashFind.codigo,
            action: hashFind.action,
            validate: hashFind.validate,
          },
        };
      }
      return false;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findByHash',
        message: error.message,
      });
      throw new HttpException('Erro ao buscar o hash', HttpStatus.NOT_ACCEPTABLE);
    }
  }

  /**
   * Cleans up expired hash entries from the database
   * @private
   */
  private async cleanupExpiredHashes(): Promise<void> {
    try {
      await this.prismaService.sessionHash.deleteMany({
        where: {
          validate: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'cleanupExpiredHashes',
        message: error.message,
      });
    }
  }

  /**
   * Generates a random 6-digit number
   * @returns Random number between 100000 and 999999
   */
  private gerarNumeroAleatorio(): number {
    return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  }

  /**
   * Generates a secure random hash using SHA-256
   * @returns Hexadecimal hash string
   */
  private gerarHash(): string {
    const randomValue = crypto.randomBytes(32).toString('hex');
    return crypto.createHash('sha256').update(randomValue).digest('hex');
  }

  /**
   * Adds specified minutes to current time
   * @param minutes - Number of minutes to add
   * @returns Date object with added minutes
   */
  private addMinutesToCurrentTime(minutes: number): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
  }
}
