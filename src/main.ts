import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { BadRequestException, ValidationPipe } from "@nestjs/common";
import * as session from "express-session";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as fs from "fs";

async function bootstrap() {
  const privateKey = fs.readFileSync('secrets/private-key.pem', 'utf8');
  const certificate = fs.readFileSync('secrets/public-certificate.pem', 'utf8');
  const credentials = { key: privateKey, cert: certificate };

  const app = await NestFactory.create(AppModule, {httpsOptions: credentials});
  app.enableCors()
  const port = process.env.PORT || 8080;

  const config = new DocumentBuilder().setTitle("Aviator").setDescription("Aviator API документация").setVersion("1.0").build();
  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync("./swagger-spec.json", JSON.stringify(document));
  SwaggerModule.setup("docs", app, document);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: true,
      // exceptionFactory: (errors) => {
      //   const result = errors.map((error) => ({
      //     property: error.property,
      //     message: error.constraints[Object.keys(error.constraints)[0]],
      //   }));
      //   return new BadRequestException(result);
      // },
    }),
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  );

  
  await app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}
bootstrap();
