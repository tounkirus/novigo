import { BadRequestException, Injectable } from "@nestjs/common";
import { PaymentProvider } from "./payment-provider";
import { OrangeMoneyProvider } from "./orange-money.provider";
import { WaveProvider } from "./wave.provider";

@Injectable()
export class PaymentProviderRegistry {
  constructor(private orange: OrangeMoneyProvider, private wave: WaveProvider) {}

  byMethod(method: string): PaymentProvider {
    if (method === "ORANGE_MONEY") return this.orange;
    if (method === "WAVE") return this.wave;
    throw new BadRequestException("Méthode Mobile Money non supportée.");
  }

  byName(name: string): PaymentProvider {
    const map: Record<string, PaymentProvider> = {
      "orange-money": this.orange, "orange_money": this.orange, "wave": this.wave,
    };
    const p = map[name?.toLowerCase()];
    if (!p) throw new BadRequestException("Fournisseur inconnu.");
    return p;
  }
}
