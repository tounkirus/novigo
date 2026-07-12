import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query,
  UploadedFile, UseGuards, UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";
import { PaginationQuery } from "../common/dto/pagination.dto";
import { UsersService } from "./users.service";
import { AddressDto, FavoriteDto, UpdateProfileDto } from "./dto/users.dto";

@Controller("users/me")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.users.me(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Post("photo")
  @UseInterceptors(FileInterceptor("file"))
  uploadPhoto(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.users.uploadPhoto(user.id, file);
  }

  @Post("documents")
  @UseInterceptors(FileInterceptor("file"))
  uploadDocument(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body("type") type: string,
  ) {
    return this.users.uploadDocument(user.id, type, file);
  }

  @Get("addresses")
  listAddresses(@CurrentUser() user: AuthUser) {
    return this.users.listAddresses(user.id);
  }

  @Post("addresses")
  createAddress(@CurrentUser() user: AuthUser, @Body() dto: AddressDto) {
    return this.users.createAddress(user.id, dto);
  }

  @Patch("addresses/:id")
  updateAddress(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: AddressDto) {
    return this.users.updateAddress(user.id, id, dto);
  }

  @Delete("addresses/:id")
  @HttpCode(204)
  deleteAddress(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.users.deleteAddress(user.id, id);
  }

  @Post("devices")
  registerDevice(@CurrentUser() user: AuthUser, @Body() body: { token: string; platform: string }) {
    return this.users.registerDevice(user.id, body.token, body.platform);
  }

  @Delete("devices/:token")
  @HttpCode(204)
  removeDevice(@CurrentUser() user: AuthUser, @Param("token") token: string) {
    return this.users.removeDevice(user.id, token);
  }

  @Get("favorites")
  listFavorites(@CurrentUser() user: AuthUser, @Query() q: PaginationQuery) {
    return this.users.listFavorites(user.id, q.page, q.limit);
  }

  @Post("favorites")
  addFavorite(@CurrentUser() user: AuthUser, @Body() dto: FavoriteDto) {
    return this.users.addFavorite(user.id, dto);
  }

  @Delete("favorites/:id")
  @HttpCode(204)
  removeFavorite(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.users.removeFavorite(user.id, id);
  }
}
