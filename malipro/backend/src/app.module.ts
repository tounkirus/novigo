import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { PrismaModule } from "./common/prisma/prisma.module";
import { MetricsModule } from "./common/metrics/metrics.module";
import { StorageModule } from "./common/storage/storage.module";
import { RedisModule } from "./common/redis/redis.module";
import { EventBusModule } from "./common/events/event-bus.module";
import { PushModule } from "./common/push/push.module";
import { EmailModule } from "./common/email/email.module";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { DriversModule } from "./drivers/drivers.module";
import { AdminModule } from "./admin/admin.module";
import { CommissionsModule } from "./commissions/commissions.module";
import { AuditModule } from "./audit/audit.module";
import { CatalogModule } from "./catalog/catalog.module";
import { WalletModule } from "./wallet/wallet.module";
import { CustomersModule } from "./customers/customers.module";
import { DeliveriesModule } from "./deliveries/deliveries.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { ChatModule } from "./chat/chat.module";
import { MerchantsModule } from "./merchants/merchants.module";
import { ArtisansModule } from "./artisans/artisans.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { SupportModule } from "./support/support.module";
import { SettlementsModule } from "./settlements/settlements.module";
import { ReferralsModule } from "./referrals/referrals.module";
import { StoresModule } from "./stores/stores.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MetricsModule,
    StorageModule,
    RedisModule,
    EventBusModule,
    PushModule,
    EmailModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    AuthModule,
    UsersModule,
    AnalyticsModule,
    OrdersModule,
    PaymentsModule,
    DriversModule,
    AdminModule,
    CommissionsModule,
    AuditModule,
    CatalogModule,
    WalletModule,
    CustomersModule,
    DeliveriesModule,
    ReviewsModule,
    RealtimeModule,
    ChatModule,
    MerchantsModule,
    ArtisansModule,
    NotificationsModule,
    PromotionsModule,
    SupportModule,
    SettlementsModule,
    ReferralsModule,
    StoresModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
