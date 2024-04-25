import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as session from "express-session";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as requestIp from "request-ip";
import * as fs from "fs";

const origin = ["http://localhost:5173", "https://avibet.io"];

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(requestIp.mw());
  app.enableCors({ origin: "*" });
  app.useStaticAssets(join(__dirname, "..", "uploads"), { prefix: "/uploads" });
  const port = process.env.PORT || 8080;

  const config = new DocumentBuilder().setTitle("Aviator").setDescription("Aviator API документация").setVersion("1.0").build();
  const document = SwaggerModule.createDocument(app, config);

  // fs.writeFileSync("./swagger-spec.json", JSON.stringify(document));

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
