# API Imperium Barbershop

## Descrição
API REST desenvolvida com NestJS para gerenciamento de barbearia, incluindo agendamentos, profissionais e serviços.

## Tecnologias Principais
- NestJS
- Prisma ORM
- JWT Authentication
- Swagger Documentation
- Redis Cache
- Bull Queue
- Mailer

## Estrutura da API

### 1. Autenticação
- **POST** `/api/v1/auth/login`
  - Login de usuários
  - Retorna token JWT

### 2. Profissionais
- **GET** `/api/v1/professional`
  - Lista todos os profissionais
- **GET** `/api/v1/professional/:id`
  - Busca profissional por ID
- **GET** `/api/v1/professional/email/:email`
  - Busca profissional por email
- **POST** `/api/v1/professional`
  - Cria novo profissional
- **PATCH** `/api/v1/professional/:id`
  - Atualiza dados do profissional
- **DELETE** `/api/v1/professional/:id`
  - Remove profissional

### 3. Agendamentos
- **GET** `/api/v1/services-schedule`
  - Lista todos os agendamentos
- **GET** `/api/v1/services-schedule/:id`
  - Busca agendamento específico
- **GET** `/api/v1/services-schedule/professional/:id`
  - Lista agendamentos por profissional
- **POST** `/api/v1/services-schedule`
  - Cria novo agendamento
- **PATCH** `/api/v1/services-schedule/:id`
  - Atualiza agendamento
- **DELETE** `/api/v1/services-schedule/:id`
  - Cancela agendamento

### 4. Administração
- **GET** `/api/v1/adm`
  - Lista administradores
- **POST** `/api/v1/adm`
  - Cria novo administrador

### 5. Sistema de Email
- **POST** `/api/v1/mailer/test`
  - Testa envio de email
- **POST** `/api/v1/mailer/confirm-register/:userId`
  - Envia email de confirmação de registro

## Autenticação e Autorização

A API utiliza JWT (JSON Web Token) para autenticação. Todas as rotas protegidas requerem o token JWT no header:
```
Authorization: Bearer <token>
```

### Níveis de Acesso
- `ADMIN`: Acesso total ao sistema
- `PROFESSIONAL`: Acesso às funcionalidades do profissional
- `CLIENT`: Acesso limitado para clientes

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
npm run start:prod
```

## Cache e Filas

- Redis é utilizado para cache de dados frequentemente acessados
- Bull Queue para processamento de tarefas assíncronas (emails, notificações)

## Logs e Monitoramento

O sistema possui um serviço de logging personalizado que registra:
- Erros de sistema
- Tentativas de autenticação
- Operações críticas
- Performance de endpoints

## Segurança

- Rate limiting para prevenir abusos
- Validação de dados com class-validator
- Sanitização de inputs
- CORS configurado
- Proteção contra ataques comuns (XSS, CSRF)

## Suporte

Para suporte, entre em contato através do email: wrm.net@gmail.com