import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AgenciesModule } from './agencies/agencies.module';
import { ClientsModule } from './clients/clients.module';
import { VendorsModule } from './vendors/vendors.module';
import { RentadorasModule } from './rentadoras/rentadoras.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ModelosModule } from './modelos/modelos.module';
import { TemporadasModule } from './temporadas/temporadas.module';
import { RateTypesModule } from './rate-types/rate-types.module';
import { VendorRatesModule } from './vendor-rates/vendor-rates.module';
import { VendorRateGroupsModule } from './vendor-rate-groups/vendor-rate-groups.module';
import { AgeTiersModule } from './age-tiers/age-tiers.module';
import { LocationsModule } from './locations/locations.module';
import { BusinessRulesModule } from './business-rules/business-rules.module';
import { CommissionsModule } from './commissions/commissions.module';
import { AgencyPricingRulesModule } from './agency-pricing-rules/agency-pricing-rules.module';
import { AgencyCategoryPriceMasksModule } from './agency-category-price-masks/agency-category-price-masks.module';
import { QuotesModule } from './quotes/quotes.module';
import { PaymentsModule } from './payments/payments.module';
import { ReservationsModule } from './reservations/reservations.module';
import { DocumentsModule } from './documents/documents.module';
import { StatusHistoryModule } from './status-history/status-history.module';
import { EmailLogsModule } from './email-logs/email-logs.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AgenciesModule,
    ClientsModule,
    VendorsModule,
    RentadorasModule,
    CategoriasModule,
    ModelosModule,
    TemporadasModule,
    RateTypesModule,
    VendorRatesModule,
    VendorRateGroupsModule,
    AgeTiersModule,
    LocationsModule,
    BusinessRulesModule,
    CommissionsModule,
    AgencyPricingRulesModule,
    AgencyCategoryPriceMasksModule,
    QuotesModule,
    PaymentsModule,
    ReservationsModule,
    DocumentsModule,
    StatusHistoryModule,
    EmailLogsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
