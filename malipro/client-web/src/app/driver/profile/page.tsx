import type { ReactNode } from "react";
import { BadgeCheck, Bike, Phone, Star, MapPin, Package, Clock, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Rating } from "@/components/ui/rating";
import { drivers } from "@/mock";
import { BAMAKO_DISTRICTS } from "@/constants";
import { formatCompact } from "@/lib/utils";

export default function DriverProfilePage() {
  const driver = drivers()[0];

  const documents = [
    { label: "Pièce d'identité", verified: true },
    { label: "Permis de conduire", verified: true },
    { label: "Carte grise du véhicule", verified: true },
    { label: "Assurance", verified: false },
  ];

  const stats = [
    { label: "Livraisons totales", value: formatCompact(driver.deliveries), icon: Package },
    { label: "Note moyenne", value: driver.rating.toFixed(1), icon: Star },
    { label: "Taux d'acceptation", value: "92 %", icon: ShieldCheck },
    { label: "Temps moyen", value: "23 min", icon: Clock },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Mon profil</h2>
        <p className="text-sm text-muted">Vos informations, votre véhicule et vos documents.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-5 p-5">
          <Avatar src={driver.avatar} alt={driver.name} size={88} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-ink">{driver.name}</h3>
              <Badge tone="info">
                <BadgeCheck className="h-3.5 w-3.5" /> Vérifié
              </Badge>
              <Badge tone="gold">Livreur Premium</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="h-4 w-4 text-brand" /> {BAMAKO_DISTRICTS[2]}, Bamako
            </p>
            <div className="mt-2">
              <Rating value={driver.rating} count={driver.deliveries} size="md" />
            </div>
          </div>
          <Button variant="secondary">Modifier le profil</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <s.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-ink">{s.value}</p>
            <p className="text-[13px] text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées & véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={driver.phone} />
            <InfoRow icon={<Bike className="h-4 w-4" />} label="Véhicule" value={driver.vehicle} />
            <InfoRow icon={<BadgeCheck className="h-4 w-4" />} label="Plaque" value={driver.plate} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Zone de service" value="District de Bamako" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((d) => (
              <div key={d.label} className="flex items-center justify-between rounded-xl border border-line bg-shell/50 px-4 py-3">
                <span className="text-sm font-medium text-ink">{d.label}</span>
                {d.verified ? (
                  <Badge tone="success">
                    <BadgeCheck className="h-3.5 w-3.5" /> Vérifié
                  </Badge>
                ) : (
                  <Badge tone="warning">En attente</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-shell text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-[12px] text-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
