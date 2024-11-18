-- CreateTable
CREATE TABLE "Credenciais" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credenciais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Fans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adm" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "Adm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfoApp" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfoApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionHash" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "codigo" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "action" TEXT NOT NULL,
    "validate" TIMESTAMP(3) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "SessionHash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" SERIAL NOT NULL,
    "tokenName" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransationWallet" (
    "id" SERIAL NOT NULL,
    "tokenName" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "rede" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,
    "walletId" INTEGER,

    CONSTRAINT "TransationWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Credenciais_email_key" ON "Credenciais"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fans_email_key" ON "Fans"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Adm_email_key" ON "Adm"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SessionHash_hash_key" ON "SessionHash"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_privateKey_key" ON "Wallet"("privateKey");

-- CreateIndex
CREATE UNIQUE INDEX "TransationWallet_toAddress_key" ON "TransationWallet"("toAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TransationWallet_privateKey_key" ON "TransationWallet"("privateKey");

-- AddForeignKey
ALTER TABLE "Credenciais" ADD CONSTRAINT "Credenciais_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fans" ADD CONSTRAINT "Fans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adm" ADD CONSTRAINT "Adm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionHash" ADD CONSTRAINT "SessionHash_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransationWallet" ADD CONSTRAINT "TransationWallet_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
