import { BAMAKO_DISTRICTS } from "@/constants";

/** Pools de noms maliens pour générer des personnes déterministes (aucun Math.random). */
const FIRST = [
  "Amadou", "Fatoumata", "Ibrahim", "Aminata", "Moussa", "Kadidia", "Oumar", "Mariam",
  "Modibo", "Awa", "Sékou", "Djénéba", "Bakary", "Rokia", "Adama", "Kadiatou",
  "Cheick", "Hawa", "Drissa", "Fanta", "Mamadou", "Assitan", "Souleymane", "Nana",
];

const LAST = [
  "Traoré", "Coulibaly", "Keïta", "Diarra", "Diallo", "Touré", "Konaté", "Sidibé",
  "Cissé", "Sangaré", "Doumbia", "Maïga", "Kanté", "Fofana", "Camara", "Dembélé",
  "Sacko", "Bagayoko",
];

const PREFIX = ["70", "76", "66", "90", "94", "83"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export interface Person {
  name: string;
  phone: string;
  district: string;
}

/** Personne déterministe dérivée d'un index. */
export function person(i: number): Person {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7 + 3) % LAST.length];
  const p = PREFIX[i % PREFIX.length];
  const phone = `+223 ${p} ${pad2(10 + (i * 7) % 89)} ${pad2(11 + (i * 13) % 88)} ${pad2(12 + (i * 17) % 87)}`;
  return {
    name: `${first} ${last}`,
    phone,
    district: BAMAKO_DISTRICTS[(i * 5 + 2) % BAMAKO_DISTRICTS.length],
  };
}
