import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  /** Public – login page needs this to show/hide Register */
  @Get()
  @Public()
  getSettings() {
    return this.service.getSettings();
  }

  /** Super admin only */
  @Patch()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.service.updateSettings(dto);
  }
}
