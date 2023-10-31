import * as bcrypt from "bcrypt";
import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "src/user/schemas/user.schema";
import { signUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { MailService } from "src/mail/mail.service";

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, @InjectModel(User.name) private userModel: Model<User>, private mailService: MailService) {}

  async signUp(dto: signUpDto) {
    const userEmail = await this.userModel.findOne({
      email: dto.email,
    });

    const userLogin = await this.userModel.findOne({
      login: dto.login,
    });

    const errors = [];

    if (userEmail) {
      errors.push("email is already used");
    }

    if (userLogin) {
      errors.push("login is already used");
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const hashedPassword = bcrypt.hashSync(dto.password, salt);

    const newUser = await this.userModel.create({ ...dto, password: hashedPassword });

    const token = this.jwtService.sign({ id: newUser._id }, {});

    return {
      token,
    };
  }

  async signIn(dto: SignInDto) {
    const user = await this.userModel.findOne({
      login: dto.login,
    });

    if (!user) {
      throw new BadRequestException("Login or password is wrong");
    }

    const isPasswordRight = bcrypt.compareSync(dto.password, user.password);

    if (!isPasswordRight) {
      throw new BadRequestException("Login or password is wrong");
    }

    const token = this.jwtService.sign({ id: user._id }, {});

    return { token };
  }

  async forgotPassword() {}
}
