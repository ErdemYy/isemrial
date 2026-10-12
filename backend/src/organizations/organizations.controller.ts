import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthenticatedUserContext } from "../common/types";
import { Role } from "@prisma/client";

@Controller("api/organizations")
@UseGuards(AuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get("current")
  async getCurrent(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.organizationsService.getCurrent(user.organizationId);
    return {
      success: true,
      data,
    };
  }

  @Patch("current")
  @Roles(Role.OWNER, Role.ADMIN)
  async updateCurrent(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const data = await this.organizationsService.updateCurrent(user.organizationId, dto);
    return {
      success: true,
      data,
    };
  }
}
