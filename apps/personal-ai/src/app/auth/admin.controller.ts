import {Controller, Post, Req, UseGuards} from "@nestjs/common";
import { GoogleAdminGuard } from "../common/guards/google-auth.guard";
import {AuthService} from "./auth.service";

@Controller('admin')
export class AdminController {

  constructor(private readonly authService: AuthService) {
  }

  @Post('login')
  @UseGuards(GoogleAdminGuard)
  async login(@Req() req: any) {
    return this.authService.login(req.user);
  }
}
