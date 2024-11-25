# API Imperium Barbershop

## Descrição
API REST desenvolvida com NestJS para gerenciamento de barbearia, incluindo agendamentos, profissionais, serviços e pagamentos.

## Tecnologias Principais
- NestJS
- Prisma ORM
- JWT Authentication
- Swagger Documentation
- Redis Cache
- Bull Queue
- Mailer
- Blockchain Integration
- Elasticsearch

## Estrutura da API

### 1. Autenticação (`/api/v1/auth`)
- **POST** `/login`
  - Login de usuários
  - Retorna token JWT
- **POST** `/refresh-token`
  - Atualiza token JWT expirado
- **POST** `/logout`
  - Realiza logout do usuário

### 2. Profissionais (`/api/v1/professional`)
- **GET** `/`
  - Lista todos os profissionais
- **GET** `/:id`
  - Busca profissional por ID
- **GET** `/email/:email`
  - Busca profissional por email
- **POST** `/`
  - Cria novo profissional
- **PATCH** `/:id`
  - Atualiza dados do profissional
- **DELETE** `/:id`
  - Remove profissional

### 3. Agendamentos (`/api/v1/services-schedule`)
- **GET** `/`
  - Lista todos os agendamentos
- **GET** `/:id`
  - Busca agendamento específico
- **GET** `/professional/:id`
  - Lista agendamentos por profissional
- **POST** `/`
  - Cria novo agendamento
- **PATCH** `/:id`
  - Atualiza agendamento
- **DELETE** `/:id`
  - Cancela agendamento

### 4. Administração (`/api/v1/adm`)
- **GET** `/`
  - Lista administradores
- **POST** `/`
  - Cria novo administrador
- **PATCH** `/:id`
  - Atualiza administrador
- **DELETE** `/:id`
  - Remove administrador

### 5. Sistema de Email (`/api/v1/mailer`)
- **POST** `/test`
  - Testa envio de email
- **POST** `/confirm-register/:userId`
  - Envia email de confirmação de registro
- **POST** `/reset-password`
  - Envia email de redefinição de senha

### 6. Pagamentos (`/api/v1/payment`)
- **POST** `/process`
  - Processa novo pagamento
- **GET** `/status/:id`
  - Verifica status do pagamento
- **POST** `/webhook`
  - Recebe notificações de pagamento

### 7. Sessões (`/api/v1/session-hash`)
- **GET** `/validate/:hash`
  - Valida hash de sessão
- **POST** `/create`
  - Cria nova sessão

## Autenticação e Autorização

A API utiliza JWT (JSON Web Token) para autenticação. Todas as rotas protegidas requerem o token JWT no header:
```
Authorization: Bearer <token>
```

### Níveis de Acesso
- `ADMIN`: Acesso total ao sistema
- `PROFESSIONAL`: Acesso às funcionalidades do profissional
- `CLIENT`: Acesso limitado para clientes

## Cache e Performance

A API utiliza Redis para cache de dados frequentemente acessados:
- Cache de profissionais ativos
- Cache de horários disponíveis
- Cache de configurações do sistema

## Documentação Swagger

A documentação completa da API está disponível através do Swagger UI:
```
http://seu-dominio/api/docs
```

## Configuração do Ambiente

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente (.env):
```
DATABASE_URL=
JWT_SECRET=
REDIS_HOST=
REDIS_PORT=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
BLOCKCHAIN_API_KEY=
ELASTICSEARCH_NODE=
```

4. Execute as migrações do Prisma:
```bash
npx prisma migrate dev
```

5. Inicie o servidor:
```bash
# desenvolvimento
npm run start:dev

# produção
npm run build
npm run start:prod
```

## Monitoramento e Logs

A API possui sistema de logging integrado que registra:
- Requisições e respostas
- Erros e exceções
- Performance e métricas
- Tentativas de autenticação

## Integração com Blockchain

A API possui integração com blockchain para:
- Registro seguro de transações
- Validação de pagamentos
- Contratos inteligentes

## Elasticsearch

Utilizado para:
- Busca avançada de agendamentos
- Análise de dados
- Monitoramento em tempo real