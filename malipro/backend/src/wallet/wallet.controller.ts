import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { WalletService } from "./wallet.service";
import { DepositDto, WithdrawDto, TransferDto } from "./wallet.dto";

@Controller("wallet")
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private wallet: WalletService) {}

  @Get("balance")
  balance(@CurrentUser() user: AuthUser) {
    return this.wallet.balance(user.id);
  }

  @Post("deposit")
  deposit(@CurrentUser() user: AuthUser, @Body() dto: DepositDto) {
    return this.wallet.deposit(user.id, dto.amount, dto.method);
  }

  @Post("withdraw")
  withdraw(@CurrentUser() user: AuthUser, @Body() dto: WithdrawDto) {
    return this.wallet.withdraw(user.id, dto.amount, dto.method);
  }

  @Post("transfer")
  transfer(@CurrentUser() user: AuthUser, @Body() dto: TransferDto) {
    return this.wallet.transfer(user.id, dto.toPhone, dto.amount);
  }

  @Get("transactions")
  transactions(@CurrentUser() user: AuthUser, @Query() q: PaginationQuery) {
    return this.wallet.transactions(user.id, q.page, q.limit);
  }
}
