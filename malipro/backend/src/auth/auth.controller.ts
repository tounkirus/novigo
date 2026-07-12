import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto } from "./dto/login.dto";
import { RegisterDto, VerifyOtpDto, ResendOtpDto, ForgotPasswordDto, ResetPasswordDto } from "./dto/otp.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  @HttpCode(201)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("verify-otp")
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.code);
  }

  @Post("resend-otp")
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.auth.resendOtp(dto.phone);
  }

  @Post("forgot-password")
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post("reset-password")
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.phone, dto.password);
  }

  @Post("refresh-token")
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout(@Body() body: { refreshToken?: string }) {
    // Révoque le refresh token via la denylist Redis (le client supprime aussi ses tokens).
    return this.auth.logout(body?.refreshToken);
  }
}
