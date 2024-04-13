import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Admin } from "src/admin/schemas/admin.schema";

@Injectable()
export class LinksService {
  constructor(@InjectModel(Admin.name) private adminSchema: Model<Admin>) {}

  async links() {
    const links = await this.adminSchema.findOne({}, ["support", "news", "chat"]);

    return links;
  }
}
