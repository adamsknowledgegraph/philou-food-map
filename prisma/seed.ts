import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function serializeList(values: string[]) {
  return JSON.stringify(
    values
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index),
  );
}

function buildGoogleMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const influencerName = "Philippine Darblay";
const influencerHandle = "philoudarblay";

const seedPlaces = [
  {
    name: "Il Brigante",
    address: "14 Rue du Ruisseau, 75018 Paris, France",
    arrondissement: "18e",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "paris"],
    foodType: ["restaurant"],
    confidenceScore: 0.9,
    needsReview: false,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/9SPUvvK5gmg",
  },
  {
    name: "Anima",
    address: "78 Rue du Cherche-Midi, 75006 Paris, France",
    arrondissement: "6e",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "left-bank"],
    foodType: ["restaurant"],
    confidenceScore: 0.88,
    needsReview: false,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/7cjA93jnODg",
  },
  {
    name: "Restaurant Willette Café Troquet",
    address: "21 Rue de Trévise, 75009 Paris, France",
    arrondissement: "9e",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "cafe"],
    foodType: ["restaurant", "cafe"],
    confidenceScore: 0.9,
    needsReview: false,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/MBSnhMDaFug",
  },
  {
    name: "Le Rubis",
    address: "10 Rue du Marché Saint-Honoré, 75001 Paris, France",
    arrondissement: "1er",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "wine-bar"],
    foodType: ["bar"],
    confidenceScore: 0.87,
    needsReview: false,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/j11fgKt6Lcg",
  },
  {
    name: "Chez Nenesse",
    address: "17 Rue de Saintonge, 75003 Paris, France",
    arrondissement: "3e",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "marais"],
    foodType: ["restaurant"],
    confidenceScore: 0.86,
    needsReview: false,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/FvfEh4zJwLg",
  },
  {
    name: "Tactile café",
    address: "164 Av. Ledru Rollin, 75011 Paris, France",
    arrondissement: "11e",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "coffee"],
    foodType: ["cafe"],
    confidenceScore: 0.91,
    needsReview: false,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/pHOsx6l5Qd",
  },
  {
    name: "Acid Lactic",
    address: "15 Rue de la Folie Méricourt, 75011 Paris, France",
    arrondissement: "11e",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "paris"],
    foodType: ["restaurant"],
    confidenceScore: 0.84,
    needsReview: true,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/Okj3ImxGS0",
  },
  {
    name: "Superfine",
    address: "8 Pass. Josset, 75011 Paris, France",
    arrondissement: "11e",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "bistro"],
    foodType: ["restaurant"],
    confidenceScore: 0.85,
    needsReview: true,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/UKJmvydGN3",
  },
  {
    name: "Holy Burek",
    address: "66 Rue du Faubourg Poissonnière, 75010 Paris, France",
    arrondissement: "10e",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "grab-and-go"],
    foodType: ["bakery"],
    confidenceScore: 0.89,
    needsReview: false,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/3xCaNnzRMR",
  },
  {
    name: "Pâtisserie Viennoise",
    address: "8 Rue de l'École de Médecine, 75006 Paris, France",
    arrondissement: "6e",
    city: "Paris",
    country: "France",
    tags: ["mapstr", "bootstrap", "pastry"],
    foodType: ["bakery", "pastry-shop"],
    confidenceScore: 0.93,
    needsReview: false,
    reason: "Publicly saved in Philippine Darblay's Mapstr map.",
    sourceUrl: "https://mapstr.com/place/zDjpmZAYFmg",
  },
];

async function main() {
  await prisma.duplicateCandidate.deleteMany();
  await prisma.googleReview.deleteMany();
  await prisma.personalPlaceState.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.source.deleteMany();
  await prisma.reviewLog.deleteMany();
  await prisma.place.deleteMany();

  const source = await prisma.source.create({
    data: {
      platform: "mapstr",
      url: "https://mapstr.com/map/philoudarblay",
      title: "Philippine Darblay public Mapstr map",
      author: influencerName,
      processedStatus: "seeded",
    },
  });

  for (const entry of seedPlaces) {
    const place = await prisma.place.create({
      data: {
        name: entry.name,
        normalizedName: normalizeText(entry.name),
        address: entry.address,
        normalizedAddress: normalizeText(entry.address),
        city: entry.city,
        arrondissement: entry.arrondissement,
        country: entry.country,
        foodType: serializeList(entry.foodType),
        tags: serializeList(entry.tags),
        googleMapsUrl: buildGoogleMapsUrl(`${entry.name}, ${entry.city}`),
        status: entry.needsReview ? "needs_review" : "approved",
        confidenceScore: entry.confidenceScore,
        needsReview: entry.needsReview,
      },
    });

    await prisma.recommendation.create({
      data: {
        placeId: place.id,
        influencerName,
        influencerHandle,
        sourceId: source.id,
        sourcePlatform: "mapstr",
        sourceUrl: entry.sourceUrl,
        sourceTitle: source.title,
        originalTextSnippet: entry.reason,
        reasonRecommended: entry.reason,
        mentionedOnly: false,
        confidenceScore: entry.confidenceScore,
        needsReview: entry.needsReview,
      },
    });

    await prisma.evidence.create({
      data: {
        placeId: place.id,
        sourceId: source.id,
        evidenceType: "seed_bootstrap",
        evidenceText: entry.reason,
        confidenceScore: entry.confidenceScore,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
