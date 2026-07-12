import type { Metadata } from "next";
import { ParcelView } from "@/features/parcel/parcel-view";

export const metadata: Metadata = {
  title: "Envoi de colis · NOVIGO",
  description: "Envoyez un colis partout à Bamako et suivez sa livraison en temps réel avec NOVIGO.",
};

export default function ParcelPage() {
  return <ParcelView />;
}
