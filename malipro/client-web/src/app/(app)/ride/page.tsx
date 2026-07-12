import type { Metadata } from "next";
import { RideView } from "@/features/ride/ride-view";

export const metadata: Metadata = {
  title: "Course · NOVIGO",
  description: "Commandez un taxi, une moto taxi ou une course express à Bamako avec NOVIGO.",
};

export default function RidePage() {
  return <RideView />;
}
