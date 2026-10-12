import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { WorkOrdersService } from "./work-orders.service";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { AddNoteDto } from "./dto/add-note.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUserContext } from "../common/types";

@Controller("api/work-orders")
@UseGuards(AuthGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("technician") technician?: string,
    @Query("deviceType") deviceType?: string,
  ) {
    const data = await this.workOrdersService.list(user.organizationId, {
      status,
      search,
      technician,
      deviceType,
    });
    return {
      success: true,
      data,
    };
  }

  @Get("metrics")
  async getMetrics(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.workOrdersService.getMetrics(user.organizationId);
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
    const data = await this.workOrdersService.getById(user.organizationId, id);
    return {
      success: true,
      data,
    };
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() dto: CreateWorkOrderDto,
  ) {
    const data = await this.workOrdersService.create(
      user.organizationId,
      user.fullName,
      dto,
    );
    return {
      success: true,
      data,
    };
  }

  @Patch(":id/status")
  async updateStatus(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    const data = await this.workOrdersService.updateStatus(
      user.organizationId,
      id,
      user.fullName,
      dto,
    );
    return {
      success: true,
      data,
    };
  }

  @Post(":id/notes")
  async addNote(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("id") id: string,
    @Body() dto: AddNoteDto,
  ) {
    const data = await this.workOrdersService.addNote(
      user.organizationId,
      id,
      user.fullName,
      dto,
    );
    return {
      success: true,
      data,
    };
  }
}
