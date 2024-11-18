import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import CONFIG from './config/swagger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { cors: true });

      // Ou, para configuração mais personalizada:
  app.enableCors({
    origin: '*',  // Permitir acesso de qualquer origem
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove propriedades não definidas no DTO
    forbidNonWhitelisted: true, // Retorna erro se propriedades não definidas forem enviadas
    transform: true, // Transforma o objeto recebido em instância do DTO
  }));

    app.enableVersioning({
      type: VersioningType.URI,
    });

    const config = new DocumentBuilder()
      .setTitle(CONFIG.swagger.title)
      .setDescription(CONFIG.swagger.descricao)
      .setVersion(CONFIG.swagger.version)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('doc', app, document);
    await app.startAllMicroservices();

    await app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando http://127.0.0.1:${process.env.PORT}`);
    });
  } catch (error: any) {
    console.log(error.message);
  }
}

bootstrap();
