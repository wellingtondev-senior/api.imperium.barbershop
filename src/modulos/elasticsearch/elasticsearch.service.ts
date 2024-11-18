import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { LoggerCustomService } from '../logger/logger.service';
import { v4 as uuidv4 } from 'uuid';



@Injectable()
export class ElasticsearchService {
    private readonly client: Client;
    private className: string;

    constructor(
        private loggerService: LoggerCustomService,
    ) {
        this.client = new Client({
            node: process.env.ELASTICSEARCH_NODE, // URL do Elasticsearch
            auth: {
                username: process.env.ELASTICSEARCH_USERNAME, // Nome de usuário
                password: process.env.ELASTICSEARCH_PASSWORD, // Senha
            },

        });

        this.className = this.constructor.name;
    }
    // Método chamado quando o módulo for inicializado
    async onModuleInit() {
        await this.testConnection();
    }
    private generateId(): string {
        return uuidv4(); // Gerando um ID único
    }
    private async testConnection(): Promise<void> {
        try {
            const response = await this.client.ping();
            this.loggerService.log({
                className: this.className,
                functionName: 'testConnection',
                message: "Elasticsearch está funcionando corretamente.",
            })
        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'testConnection',
                message: error.message,
            })
            throw new Error('Falha ao conectar ao Elasticsearch. Verifique as configurações.');
        }
    }
    // Método para indexar um documento
    async indexDocument(index: string, body: any) {
        try {
            const id = this.generateId();
            const result = await this.client.index({
                index,
                id,
                body:JSON.parse(JSON.stringify(body)),
            });
            console.log(result)
            return result
        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'indexDocument',
                message: error.message,
            })
            throw new Error('Falha ao conectar ao Elasticsearch. Verifique as configurações.');
        }
    }
    async search(index:string, query: any) {
       // Obter o nome do índice
    
        try {
          const result = await this.client.search({
            index,
            body: query,
          });
                
         return result.hits.hits.map((e)=>e._source);// Retorna os hits encontrados
        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'indexDocument',
                message: error.message,
            })          
            return error.message
        }
      }
      async updateDocument(index:string, eventoId: string, body: any) {
        try {
            const response = await this.client.update({
              index,       // Nome do índice onde o documento está
              id: eventoId,            // ID do documento que deseja atualizar
              body: {
                doc: body  // Substitui todo o campo portal com novos valores
                }
              
            });
            return response
      
          } catch (error) {
            this.loggerService.error({
              className: this.className,
              functionName: 'getUFCEventsAll',
              message: `${error.message}`,
            })
            return error.message
      
          }
      }
}

