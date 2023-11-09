import { Module } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";
import { SocketService } from "./socket.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { ConvertModule } from "src/convert/convert.module";

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), ConvertModule],
  providers: [SocketGateway, SocketService],
})
export class SocketModule {}
