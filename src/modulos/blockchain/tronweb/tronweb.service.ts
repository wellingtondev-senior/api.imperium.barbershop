import { Injectable } from '@nestjs/common';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { BigNumber, TronWeb } from 'tronweb';
import * as fs from 'fs';
import * as solc from 'solc';
import { keccak256 } from 'ethers';
// Variáveis de ambiente para configuração da API Tron e chave privada da carteira
const TRON_API_KEY = process.env.TRON_API_KEY; // Chave da API Tron
const TRON_API_URL = process.env.TRON_API_URL; // URL da API Tron

@Injectable()
export class TronwebService {
    private tronWeb: TronWeb;  // Instância do TronWeb para interações com a blockchain Tron
    private className: string;  // Nome da classe para logs
    private WALLET_PRIVATE_KEY: string;  // Chave privada da carteira



    constructor(
        private readonly prismaService: PrismaService,  // Serviço Prisma para interações com o banco de dados
        private readonly loggerService: LoggerCustomService, // Serviço de log personalizado
    ) {
        // Inicializa o TronWeb com a URL da API e a chave privada
        this.tronWeb = new TronWeb({
            fullHost: TRON_API_URL, // URL da API Tron
            headers: { "TRON-PRO-API-KEY": TRON_API_KEY }, // Adiciona a chave da API no cabeçalho
            privateKey: this.WALLET_PRIVATE_KEY, // Chave privada da carteira
        });

        this.className = this.constructor.name;  // Obtém o nome da classe para uso em logs
    }

    /**
     * Compila e implanta um contrato Solidity na rede Tron.
     * @param contractName - Nome do arquivo do contrato (ex: "MyContract.sol")
     * @param contractClassName - Nome da classe do contrato a ser implantado
     * @param constructorParams - Parâmetros para o construtor do contrato
     * @returns - Informações sobre o contrato implantado
     */
    async deployContract(
        contractName: string,
        contractClassName: string,
        constructorParams: string[] = []
    ): Promise<any> {
        try {
            this.WALLET_PRIVATE_KEY = '' // Define a chave privada da carteira
            // Lê o código fonte do contrato Solidity
            const source = fs.readFileSync(`${process.cwd()}/contract/Tron/${contractName}`, 'utf8');
            const bytes = Buffer.from(source, 'utf8');
            const contractHash = keccak256(bytes);
            // Define a estrutura de entrada para o compilador Solidity
            const input = {
                language: 'Solidity',
                sources: {
                    [contractName]: {
                        content: source, // Código fonte do contrato
                    },
                },
                settings: {
                    outputSelection: {
                        '*': {
                            '*': ['*'],  // Seleciona todas as informações de saída do compilador
                        },
                    },
                },
            };

            // Compila o contrato usando o compilador Solidity
            const compiler = solc.compile(JSON.stringify(input));
            const output = JSON.parse(compiler);


            // // Verifica se ocorreram erros durante a compilação
            if (output.errors) {
                const errors = output.errors.filter((error: any) => error.severity === 'error');
                if (errors.length > 0) {
                    // Registra erros de compilação
                    errors.forEach((error: any) =>
                        this.loggerService.log({
                            className: this.className,
                            functionName: 'deployContract',
                            message: error.formattedMessage, // Mensagem formatada do erro
                        }));
                    throw new Error('Contract compilation failed with errors');
                }
            }

            // Obtém os dados do contrato a partir da saída da compilação
            const contractData = output.contracts[contractName];
            if (!contractData || !contractData[contractClassName]) {
                throw new Error(`Contract ${contractClassName} not found in compilation output`);
            }
            // Implanta o contrato na rede Tron
            const contract = await this.tronWeb.contract().new({
                abi: contractData[contractClassName].abi,  // ABI do contrato
                bytecode: contractData[contractClassName].evm.bytecode.object, // Bytecode do contrato
                feeLimit: 1000000000,  // Limite de taxa para a transação
                callValue: 0,  // Valor a ser enviado (se houver)
                parameters: constructorParams,  // Parâmetros do construtor
            });
            // Verifica se o contrato foi implantado com sucesso
            if (contract?.address) {

                const deployedAddress = this.tronWeb.address.fromHex(contract.address); // Converte o endereço para o formato base58

                return {
                    abi: contractData[contractClassName].abi,  // ABI do contrato
                    contractName: contractClassName,  // Nome da classe do contrato
                    address: deployedAddress,  // Endereço do contrato implantado
                    contractHash,
                    bytecode: contractData[contractClassName].evm.bytecode.object, // Bytecode do contrato
                    // Hash do contrato
                };
            }
            //  throw new Error('Contract deployment failed - no address returned');

        } catch (error) {
            // Registra qualquer erro encontrado durante o processo
            this.loggerService.error({
                className: this.className,
                functionName: 'deployContract',
                message: error.message, // Log apenas a mensagem de erro
            });
            throw error;  // Repassa o erro para o chamador
        }
    }

    /**
     * Cria uma nova conta na rede Tron.
     * @returns - Detalhes da nova conta criada
     */
    async createAccount(): Promise<any> {
        const wallet = await this.tronWeb.createAccount(); // Cria uma nova conta
        return wallet; // Retorna os detalhes da conta
    }

    /**
     * Converte o saldo de Sun para TRX.
     * @param balance - Saldo em Sun
     * @returns - Saldo em TRX
     */
    fromSun(balance: number): BigNumber | string {
        return this.tronWeb.fromSun(balance); // Converte de Sun para TRX e retorna o saldo convertido
    }


    /**
     * Obtém o saldo de uma conta específica.
     * @param address - Endereço da conta
     * @returns - Saldo da conta
     */
    async balance(address: string): Promise<number> {
        return await this.tronWeb.trx.getBalance(address); // Obtém e retorna o saldo da conta
    }

    /**
     * Retorna uma instância de contrato existente.
     * @param contractAddress - Endereço do contrato
     * @param abi - ABI do contrato
     * @returns - Instância do contrato ou null em caso de erro
     */
    async getContract(contractAddress: string, abi: any): Promise<any> {
        try {
            return await this.tronWeb.contract(abi, contractAddress); // Retorna a instância do contrato
        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'getContract',
                message: error instanceof Error ? error.message : 'Unknown error occurred', // Mensagem de erro
            });
            return null; // Retorna null em caso de erro
        }
    }
    async getAddressInfo(address: string, private_key: string):Promise<AccountDetails> {
        try {
            this.WALLET_PRIVATE_KEY = private_key;
            const balance = await this.tronWeb.trx.getBalance(address);
            const { count } = await this.tronWeb.trx.getAvailableUnfreezeCount(address);
            const bandwidthPrices = await this.tronWeb.trx.getBandwidthPrices();
            const energyPrice = await this.tronWeb.trx.getEnergyPrices();
            const { max_size: delegatedMaxSizeBand } = await this.tronWeb.trx.getCanDelegatedMaxSize(address, 'BANDWIDTH');
            const { max_size: delegatedMaxSizeEnergy } = await this.tronWeb.trx.getCanDelegatedMaxSize(address, "ENERGY");
            const bandwidth = await this.tronWeb.trx.getBandwidth(address);
             const accountResources = await this.tronWeb.trx.getAccountResources(address);
             const account = await this.tronWeb.trx.getAccount(address);
            const isAddress = this.tronWeb.isAddress(address);
        //   //  const rewardInfo = await this.tronWeb.trx.getReward(address);

            return {
                address,
                isValidAddress: isAddress,
                balance,
                bandwidth,
                bandwidthPrices,
                energyPrice,
                delegatedMaxSizeBand,
                delegatedMaxSizeEnergy,
                 accountResources,
                accountDetails: account,
                unfreeze: count,
            };
        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'getAddressInfo',
                message: error.message,
            });
            return null;
        }
    }
}
