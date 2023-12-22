import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as session from "express-session";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as fs from "fs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env.PORT || 8080;

  const config = new DocumentBuilder().setTitle("Aviator").setDescription("Aviator API документация").setVersion("1.0").build();
  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync("./swagger-spec.json", JSON.stringify(document));
  SwaggerModule.setup("docs", app, document);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
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
