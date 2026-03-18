import { Module, Global } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CountriesModule } from './modules/countries/countries.module';
import { ThemesModule } from './modules/themes/themes.module';
import { IndicatorsModule } from './modules/indicators/indicators.module';
import { DataModule } from './modules/data/data.module';
import { YouthIndexModule } from './modules/youth-index/youth-index.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlatformModule } from './modules/platform/platform.module';
import { CacheService } from './common/cache.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    CountriesModule,
    ThemesModule,
    IndicatorsModule,
    DataModule,
    YouthIndexModule,
    AuthModule,
    PlatformModule,
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppModule {}
