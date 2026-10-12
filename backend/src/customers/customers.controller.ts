import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUserContext } from "../common/types";

@Controller("api/customers")
@UseGuards(AuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query("search") search?: string,
  ) {
    const data = await this.customersService.list(user.organizationId, search);
    return {
      success: true,
      data,
    };
  }

  @Get(":id")
  async getById(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("id") id: string,
  ) {
    const data = await this.customersService.getById(user.organizationId, id);
    return {
      success: true,
      data,
    };
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() dto: CreateCustomerDto,
  ) {
    const data = await this.customersService.create(user.organizationId, dto);
    return {
      success: true,
      data,
    };
  }
}
