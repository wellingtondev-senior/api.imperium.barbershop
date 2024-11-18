Aqui está a explicação das principais funções internas de um contrato TRON (TRX) em formato **Markdown**:

```markdown
# Funções Internas de Contratos TRON (TRX)

Os contratos inteligentes da blockchain TRON são escritos principalmente em **Solidity**. Abaixo, está uma lista das funções mais comuns em contratos inteligentes na TRON, com explicações.

## 1. Funções de Ciclo de Vida do Contrato

### `constructor()`
- **O que faz**: Define o estado inicial do contrato quando implantado na blockchain.
- **Exemplo**:
  ```solidity
  constructor() {
      owner = msg.sender; // Define o deployer como proprietário
  }
  ```

### `selfdestruct(address payable _recipient)`
- **O que faz**: Remove o contrato da blockchain e transfere os fundos restantes para o endereço especificado.
- **Exemplo**:
  ```solidity
  function close() public {
      require(msg.sender == owner, "Apenas o proprietário pode destruir o contrato");
      selfdestruct(payable(owner));
  }
  ```

## 2. Funções de Acesso e Controle

### `modifier onlyOwner()`
- **O que faz**: Restringe o acesso a certas funções, permitindo que apenas o proprietário chame essas funções.
- **Exemplo**:
  ```solidity
  modifier onlyOwner() {
      require(msg.sender == owner, "Apenas o proprietário pode chamar esta função");
      _;
  }
  ```

### `transferOwnership(address newOwner)`
- **O que faz**: Transfere a propriedade do contrato para um novo endereço.
- **Exemplo**:
  ```solidity
  function transferOwnership(address newOwner) public onlyOwner {
      owner = newOwner;
  }
  ```

## 3. Funções de Transferência de TRX (Tokens Nativos)

### `transfer(address recipient, uint256 amount)`
- **O que faz**: Transfere TRX ou tokens do contrato para o endereço do `recipient`.
- **Exemplo**:
  ```solidity
  function transferTRX(address payable recipient, uint256 amount) public onlyOwner {
      recipient.transfer(amount);
  }
  ```

### `balanceOf(address account)`
- **O que faz**: Retorna o saldo de TRX ou tokens que um determinado endereço possui.
- **Exemplo**:
  ```solidity
  function balanceOf(address account) public view returns (uint256) {
      return address(account).balance;
  }
  ```

## 4. Funções de Armazenamento e Recuperação

### `store(uint256 value)`
- **O que faz**: Armazena um valor em uma variável de estado ou mapeamento.
- **Exemplo**:
  ```solidity
  uint256 public storedValue;
  
  function store(uint256 value) public {
      storedValue = value;
  }
  ```

### `retrieve()`
- **O que faz**: Retorna o valor armazenado.
- **Exemplo**:
  ```solidity
  function retrieve() public view returns (uint256) {
      return storedValue;
  }
  ```

## 5. Funções Padrão TRC-20

### `totalSupply()`
- **O que faz**: Retorna o número total de tokens existentes.
- **Exemplo**:
  ```solidity
  function totalSupply() public view returns (uint256) {
      return _totalSupply;
  }
  ```

### `balanceOf(address account)`
- **O que faz**: Retorna o saldo de tokens de um endereço específico.
- **Exemplo**:
  ```solidity
  function balanceOf(address account) public view returns (uint256) {
      return _balances[account];
  }
  ```

### `transfer(address recipient, uint256 amount)`
- **O que faz**: Transfere tokens do chamador para o endereço do `recipient`.
- **Exemplo**:
  ```solidity
  function transfer(address recipient, uint256 amount) public returns (bool) {
      _transfer(msg.sender, recipient, amount);
      return true;
  }
  ```

### `approve(address spender, uint256 amount)`
- **O que faz**: Aprova que um terceiro (`spender`) possa gastar tokens em nome do chamador.
- **Exemplo**:
  ```solidity
  function approve(address spender, uint256 amount) public returns (bool) {
      _allowances[msg.sender][spender] = amount;
      return true;
  }
  ```

### `allowance(address owner, address spender)`
- **O que faz**: Retorna a quantidade de tokens que o `spender` pode gastar da conta do `owner`.
- **Exemplo**:
  ```solidity
  function allowance(address owner, address spender) public view returns (uint256) {
      return _allowances[owner][spender];
  }
  ```

### `transferFrom(address sender, address recipient, uint256 amount)`
- **O que faz**: Transfere tokens de uma conta para outra, com a permissão do `sender`.
- **Exemplo**:
  ```solidity
  function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
      _transfer(sender, recipient, amount);
      return true;
  }
  ```

## 6. Funções de Energia (Energy) e Largura de Banda (Bandwidth)

### `freezeBandwidth(uint256 amount)`
- **O que faz**: Congela uma quantidade de TRX para obter largura de banda.
  
### `freezeEnergy(uint256 amount)`
- **O que faz**: Congela uma quantidade de TRX para obter energia, necessária para a execução de contratos complexos.

---

Essas funções são as mais comuns em contratos inteligentes TRON (TRX) escritos em **Solidity**, abordando desde o controle de acesso até a manipulação de tokens e gestão de recursos como **Energy** e **Bandwidth**.
```

Esse conteúdo em **Markdown** pode ser usado diretamente em plataformas como GitHub, documentação de projetos, ou qualquer ambiente que suporte esse formato para explicações claras e detalhadas sobre contratos TRON.