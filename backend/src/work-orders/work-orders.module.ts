import { Module } from "@nestjs/common";
import { WorkOrdersService } from "./work-orders.service";
import { WorkOrdersController } from "./work-orders.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
