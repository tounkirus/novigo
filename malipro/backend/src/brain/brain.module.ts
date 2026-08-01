import { Global, Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module";
import { BrainService } from "./brain.service";
import { BrainController } from "./brain.controller";
import { KnowledgeService } from "./knowledge.service";
import { DecisionLogService } from "./decision-log.service";
import { ServiceRegistryService } from "./service-registry.service";
import { CityIntelligenceEngine } from "./engines/city-intelligence.engine";
import { RouteIntelligenceEngine } from "./engines/route-intelligence.engine";
import { SmartPricingEngine } from "./engines/smart-pricing.engine";
import { ServiceDecisionEngine } from "./engines/service-decision.engine";
import { BatchEngine } from "./engines/batch.engine";
import { TrustEngine } from "./engines/trust.engine";
import { FraudEngine } from "./engines/fraud.engine";
import { LearningEngine } from "./engines/learning.engine";

/// NOVIGO BRAIN — module global : le domaine ops (commandes, livraisons) appelle
/// le Brain pour décider, jamais l'inverse. Exporté globalement pour éviter des
/// dépendances circulaires entre modules métier.
@Global()
@Module({
  imports: [RealtimeModule],
  controllers: [BrainController],
  providers: [
    BrainService,
    KnowledgeService,
    DecisionLogService,
    ServiceRegistryService,
    CityIntelligenceEngine,
    RouteIntelligenceEngine,
    SmartPricingEngine,
    ServiceDecisionEngine,
    BatchEngine,
    TrustEngine,
    FraudEngine,
    LearningEngine,
  ],
  exports: [BrainService, KnowledgeService, DecisionLogService, ServiceRegistryService, TrustEngine],
})
export class BrainModule {}
