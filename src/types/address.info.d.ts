interface AccountDetails {
  /** Endereço da conta em formato base58 */
  address: string;
  /** Indica se o endereço é válido */
  isValidAddress: boolean;
  /** Saldo da conta em TRX, expresso em sun (1 TRX = 1_000_000 sun) */
  balance: number;
  /** Largura de banda disponível para a conta */
  bandwidth: number;
  /** Histórico de preços da largura de banda, com timestamps e valores */
  bandwidthPrices: string;
  /** Histórico de preços da energia, com timestamps e valores */
  energyPrice: string;
  /** Tamanho máximo que pode ser delegado para largura de banda */
  delegatedMaxSizeBand: number;
  /** Tamanho máximo que pode ser delegado para energia */
  delegatedMaxSizeEnergy: number;
  /** Recursos da conta, como limites de largura de banda e energia */
  accountResources: AccountResources;
  /** Informações detalhadas da conta, incluindo permissões e recursos */
  accountDetails: Account;
  /** Número de tokens disponíveis para serem descongelados */
  unfreeze: number;
}

interface AccountResources {
  /** Limite gratuito de largura de banda disponível para a conta */
  freeNetLimit: number;
  /** Limite total de largura de banda disponível */
  TotalNetLimit: number;
  /** Peso total de largura de banda em toda a rede */
  TotalNetWeight: number;
  /** Limite total de energia disponível para a conta */
  TotalEnergyLimit: number;
  /** Peso total de energia em toda a rede */
  TotalEnergyWeight: number;
}

interface Account {
  /** Endereço da conta no formato hexadecimal */
  address: string;
  /** Saldo atual da conta em sun */
  balance: number;
  /** Timestamp da criação da conta em milissegundos */
  create_time?: number;
  /** Tamanho da janela de largura de banda */
  net_window_size?: number;
  /** Indica se a janela de largura de banda é otimizada */
  net_window_optimized?: number;
  /** Recursos específicos da conta relacionados à energia */
  account_resource?: {
      energy_window_size: number;
      energy_window_optimized: boolean;
  };
  /** Permissão do proprietário da conta */
  owner_permission?: Permission;
  /** Permissões ativas da conta */
  active_permission?: Permission[];
  /** Recursos congelados, como "ENERGY" ou "TRON_POWER" */
  frozenV2?: FrozenResource[];
  /** Indica se os ativos da conta estão otimizados */
  asset_optimized?: boolean;
}

interface Permission {
  /** Nome da permissão, por exemplo, "owner" */
  permission_name: string;
  /** Limiar para autorizar operações com essa permissão */
  threshold: number;
  /** Chaves associadas e pesos para autorização */
  keys: PermissionKey[];
}

interface PermissionKey {
  /** Endereço da chave, em formato hexadecimal */
  address: string;
  /** Peso da chave para autorização */
  weight: number;
}

interface FrozenResource {
  /** Tipo do recurso congelado, por exemplo, "ENERGY" */
  type?: string;
}
