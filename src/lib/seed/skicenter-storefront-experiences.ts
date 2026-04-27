/**
 * Skicenter storefront seed data — ski travel experiences for the public site at /s/skicenter.
 * Stations use the human-readable names that the storefront filter expects
 * (StorefrontNav DESTINOS + experiencias page filter use ".includes(name)").
 */

export interface SeedExperience {
  category: string;
  name: string;
  slug: string;
  station: string;
  description: string;
  personType?: "adulto" | "infantil";
  tier?: "media_quality" | "alta_quality";
  priceType: "per_day" | "per_session" | "fixed";
  price: number;
  isFeatured?: boolean;
  coverImageUrl: string;
  sortOrder: number;
}

// Curated unsplash images of mountains, ski resorts and après-ski.
const IMG = {
  alps: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop",
  mountainRange: "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=800&h=600&fit=crop",
  skierAction: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&h=600&fit=crop",
  freshSnow: "https://images.unsplash.com/photo-1486648791255-7b327fa1c1d4?w=800&h=600&fit=crop",
  pinesSnow: "https://images.unsplash.com/photo-1548777123-e216912df7d8?w=800&h=600&fit=crop",
  hotelMountain: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&h=600&fit=crop",
  skiSchool: "https://images.unsplash.com/photo-1502301197179-65228ab57f78?w=800&h=600&fit=crop",
  rental: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&h=600&fit=crop",
  forfait: "https://images.unsplash.com/photo-1522056615691-da7b8106c665?w=800&h=600&fit=crop",
  apresSki: "https://images.unsplash.com/photo-1542903660-eedba2cda473?w=800&h=600&fit=crop",
  lockers: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
  family: "https://images.unsplash.com/photo-1454942901704-3c44c11b2ad1?w=800&h=600&fit=crop",
};

export const STATIONS = [
  "Baqueira Beret",
  "Sierra Nevada",
  "Formigal",
  "Alto Campoo",
  "Candanchú",
  "Astún",
  "La Pinilla",
] as const;

export const CATEGORIES: { slug: string; name: string; sortOrder: number }[] = [
  { slug: "pack", name: "Packs todo incluido", sortOrder: 1 },
  { slug: "forfait", name: "Forfaits", sortOrder: 2 },
  { slug: "escuela", name: "Escuela de esquí", sortOrder: 3 },
  { slug: "clase_particular", name: "Clases particulares", sortOrder: 4 },
  { slug: "alquiler", name: "Alquiler de material", sortOrder: 5 },
  { slug: "apreski", name: "Après-ski", sortOrder: 6 },
  { slug: "locker", name: "Taquillas", sortOrder: 7 },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ── PACKS TODO INCLUIDO (one per station, featured) ──
const PACKS: SeedExperience[] = [
  {
    category: "pack",
    name: "Pack 4 días Baqueira Beret — Todo incluido",
    station: "Baqueira Beret",
    description:
      "Escapada premium a la mayor estación de España. Incluye 3 noches de hotel a 5 minutos de pistas, forfait de 4 días, alquiler de material de gama alta y 2 horas de clase con monitor titulado. Régimen de media pensión y traslado al pie de pistas.",
    priceType: "fixed",
    price: 399,
    isFeatured: true,
    coverImageUrl: IMG.mountainRange,
    sortOrder: 10,
    slug: "",
  },
  {
    category: "pack",
    name: "Pack 3 días Sierra Nevada — Esquí + Alhambra",
    station: "Sierra Nevada",
    description:
      "Combina nieve y cultura: 2 noches en hotel cercano a pistas, forfait 3 días, alquiler de equipo completo y entrada para visitar la Alhambra de Granada. Una experiencia única que solo Sierra Nevada puede ofrecer.",
    priceType: "fixed",
    price: 289,
    isFeatured: true,
    coverImageUrl: IMG.alps,
    sortOrder: 11,
    slug: "",
  },
  {
    category: "pack",
    name: "Pack 4 días Formigal — Familia",
    station: "Formigal",
    description:
      "Pack pensado para familias: 3 noches en apartamento equipado, forfait 4 días con descuento infantil, alquiler de material adaptado y 4 horas de clases en grupo para los más pequeños. Sallent de Gállego a 5 minutos.",
    priceType: "fixed",
    price: 329,
    isFeatured: true,
    coverImageUrl: IMG.freshSnow,
    sortOrder: 12,
    slug: "",
  },
  {
    category: "pack",
    name: "Pack fin de semana Alto Campoo",
    station: "Alto Campoo",
    description:
      "Escapada cántabra de 2 días: alojamiento en Reinosa, forfait 2 días, alquiler de esquís de gama media y 2 horas de iniciación. Ideal para descubrir la nieve atlántica desde el norte de España.",
    priceType: "fixed",
    price: 199,
    isFeatured: true,
    coverImageUrl: IMG.pinesSnow,
    sortOrder: 13,
    slug: "",
  },
  {
    category: "pack",
    name: "Pack 3 días Candanchú — Pirineo Aragonés",
    station: "Candanchú",
    description:
      "Tres días en una de las estaciones más históricas de España. Hotel en el Valle del Aragón, forfait 3 días, alquiler completo y 3 horas de clase con instructor experimentado. Acceso combinado Astún-Candanchú opcional.",
    priceType: "fixed",
    price: 259,
    isFeatured: true,
    coverImageUrl: IMG.skiSchool,
    sortOrder: 14,
    slug: "",
  },
  {
    category: "pack",
    name: "Pack 3 días Astún — Freestyle",
    station: "Astún",
    description:
      "Pensado para freestylers y amantes del snowpark: 2 noches de hotel en Jaca, forfait 3 días con acceso al snowpark de Astún, alquiler de tablas de snowboard y casco. Ambiente joven y dinámico.",
    priceType: "fixed",
    price: 249,
    isFeatured: true,
    coverImageUrl: IMG.skierAction,
    sortOrder: 15,
    slug: "",
  },
  {
    category: "pack",
    name: "Pack fin de semana La Pinilla — Madrid",
    station: "La Pinilla",
    description:
      "La opción más cercana a Madrid: alojamiento en Riaza, forfait 2 días, alquiler de esquís y 2 horas de clases de iniciación. Perfecto para escapadas exprés desde el centro peninsular.",
    priceType: "fixed",
    price: 189,
    isFeatured: true,
    coverImageUrl: IMG.family,
    sortOrder: 16,
    slug: "",
  },
];

// ── HOTEL + FORFAIT (4 stations) ──
const HOTEL_FORFAIT: SeedExperience[] = [
  {
    category: "pack",
    name: "Hotel + Forfait 3 noches Baqueira Beret",
    station: "Baqueira Beret",
    description:
      "Pack alojamiento + forfait sin extras. 3 noches en hotel 3* en Vielha o Baqueira con desayuno + forfait 3 días. Material y clases no incluidos: la opción ideal si ya tienes equipo propio.",
    priceType: "fixed",
    price: 289,
    coverImageUrl: IMG.hotelMountain,
    sortOrder: 20,
    slug: "",
  },
  {
    category: "pack",
    name: "Hotel + Forfait 2 noches Sierra Nevada",
    station: "Sierra Nevada",
    description:
      "Alojamiento de 2 noches en hotel próximo a las pistas + forfait 2 días. Granada y la Alhambra a 30 minutos. La fórmula más sencilla para una escapada de fin de semana.",
    priceType: "fixed",
    price: 219,
    coverImageUrl: IMG.alps,
    sortOrder: 21,
    slug: "",
  },
  {
    category: "pack",
    name: "Apartamento + Forfait 3 noches Formigal",
    station: "Formigal",
    description:
      "Apartamento equipado para 4 personas en Sallent de Gállego + forfait 3 días por persona. Cocina, salón y dormitorios separados. Precio por persona en ocupación cuádruple.",
    priceType: "fixed",
    price: 199,
    coverImageUrl: IMG.freshSnow,
    sortOrder: 22,
    slug: "",
  },
  {
    category: "pack",
    name: "Hotel + Forfait 2 noches La Pinilla",
    station: "La Pinilla",
    description:
      "2 noches en hotel rural en Riaza con desayuno + forfait 2 días. Cocina segoviana, ambiente familiar y la nieve más cercana a Madrid sin pasos de montaña.",
    priceType: "fixed",
    price: 149,
    coverImageUrl: IMG.family,
    sortOrder: 23,
    slug: "",
  },
];

// ── FORFAITS (7 adulto + 3 infantil) ──
const FORFAITS: SeedExperience[] = [
  ...STATIONS.map((station, i) => {
    const prices: Record<string, number> = {
      "Baqueira Beret": 69,
      "Sierra Nevada": 59,
      Formigal: 55,
      "Alto Campoo": 39,
      Candanchú: 49,
      Astún: 49,
      "La Pinilla": 39,
    };
    return {
      category: "forfait",
      name: `Forfait día adulto — ${station}`,
      station,
      description: `Forfait de 1 día para adulto en ${station}. Acceso a todas las pistas y remontes de la estación. Precio temporada media; consulta tarifas alta temporada.`,
      personType: "adulto" as const,
      priceType: "per_day" as const,
      price: prices[station]!,
      coverImageUrl: IMG.forfait,
      sortOrder: 30 + i,
      slug: "",
    } as SeedExperience;
  }),
  {
    category: "forfait",
    name: "Forfait día infantil — Baqueira Beret",
    station: "Baqueira Beret",
    description:
      "Forfait infantil (6-11 años) de 1 día en Baqueira Beret. Niños menores de 6 años gratuitos acompañados de un adulto con forfait. Precio temporada media.",
    personType: "infantil",
    priceType: "per_day",
    price: 45,
    coverImageUrl: IMG.forfait,
    sortOrder: 40,
    slug: "",
  },
  {
    category: "forfait",
    name: "Forfait día infantil — Sierra Nevada",
    station: "Sierra Nevada",
    description:
      "Forfait infantil (6-11 años) de 1 día en Sierra Nevada. Acceso completo a todas las pistas. Precio temporada media; consulta tarifas alta temporada.",
    personType: "infantil",
    priceType: "per_day",
    price: 39,
    coverImageUrl: IMG.forfait,
    sortOrder: 41,
    slug: "",
  },
  {
    category: "forfait",
    name: "Forfait día infantil — La Pinilla",
    station: "La Pinilla",
    description:
      "Forfait infantil (6-11 años) de 1 día en La Pinilla. Pistas pensadas para principiantes y la opción más asequible para iniciar a los más pequeños.",
    personType: "infantil",
    priceType: "per_day",
    price: 29,
    coverImageUrl: IMG.forfait,
    sortOrder: 42,
    slug: "",
  },
];

// ── ESCUELA grupal (5) + CLASE PARTICULAR (3) ──
const ESCUELA: SeedExperience[] = [
  {
    category: "escuela",
    name: "Clase grupal adulto — Baqueira Beret",
    station: "Baqueira Beret",
    description:
      "Clase de esquí en grupo reducido (máx. 8 alumnos) con monitor titulado de la escuela oficial de Baqueira. 2 horas diarias, agrupados por nivel. Ideal para principiantes y nivel medio.",
    personType: "adulto",
    priceType: "per_session",
    price: 75,
    coverImageUrl: IMG.skiSchool,
    sortOrder: 50,
    slug: "",
  },
  {
    category: "escuela",
    name: "Clase grupal adulto — Sierra Nevada",
    station: "Sierra Nevada",
    description:
      "Clase de esquí en grupo de la escuela oficial de Sierra Nevada. 2 horas diarias en sesión de mañana o tarde, monitor titulado y agrupación por nivel.",
    personType: "adulto",
    priceType: "per_session",
    price: 65,
    coverImageUrl: IMG.skiSchool,
    sortOrder: 51,
    slug: "",
  },
  {
    category: "escuela",
    name: "Clase grupal adulto — Formigal",
    station: "Formigal",
    description:
      "Clase grupal con monitor de la escuela oficial de Formigal. 2 horas diarias, máximo 8 alumnos. Recomendable para iniciación y perfeccionamiento de técnica.",
    personType: "adulto",
    priceType: "per_session",
    price: 59,
    coverImageUrl: IMG.skiSchool,
    sortOrder: 52,
    slug: "",
  },
  {
    category: "escuela",
    name: "Clase grupal infantil — Candanchú",
    station: "Candanchú",
    description:
      "Clase infantil (6-12 años) en la escuela oficial de Candanchú. Grupos reducidos por edad y nivel. Incluye seguro escolar y material pedagógico (no incluye equipo).",
    personType: "infantil",
    priceType: "per_session",
    price: 49,
    coverImageUrl: IMG.skiSchool,
    sortOrder: 53,
    slug: "",
  },
  {
    category: "escuela",
    name: "Clase grupal infantil — La Pinilla",
    station: "La Pinilla",
    description:
      "Clase infantil para iniciación en La Pinilla. La estación más cercana a Madrid es ideal para que los peques den sus primeros pasos sobre la nieve. Monitor titulado.",
    personType: "infantil",
    priceType: "per_session",
    price: 45,
    coverImageUrl: IMG.skiSchool,
    sortOrder: 54,
    slug: "",
  },
];

const CLASE_PARTICULAR: SeedExperience[] = [
  {
    category: "clase_particular",
    name: "Clase particular 1h — Baqueira Beret",
    station: "Baqueira Beret",
    description:
      "Clase privada con monitor para 1-2 personas. Plan de aprendizaje a medida según tu nivel y objetivos. Idiomas: español, inglés y francés.",
    priceType: "per_session",
    price: 89,
    coverImageUrl: IMG.skierAction,
    sortOrder: 60,
    slug: "",
  },
  {
    category: "clase_particular",
    name: "Clase particular 1h — Sierra Nevada",
    station: "Sierra Nevada",
    description:
      "Clase privada con monitor titulado en Sierra Nevada. Para 1-2 personas, sesión de 1 hora con flexibilidad horaria. Recomendado para perfeccionamiento técnico.",
    priceType: "per_session",
    price: 75,
    coverImageUrl: IMG.skierAction,
    sortOrder: 61,
    slug: "",
  },
  {
    category: "clase_particular",
    name: "Clase particular 1h — La Pinilla",
    station: "La Pinilla",
    description:
      "Clase privada en La Pinilla con monitor de la escuela oficial. Sesión de 1 hora, atención exclusiva. Ideal para clases familiares en grupo cerrado (1-2 personas).",
    priceType: "per_session",
    price: 65,
    coverImageUrl: IMG.skierAction,
    sortOrder: 62,
    slug: "",
  },
];

// ── ALQUILER (5 alta + 3 media) ──
const ALQUILER: SeedExperience[] = [
  {
    category: "alquiler",
    name: "Alquiler equipo completo gama alta — Baqueira Beret",
    station: "Baqueira Beret",
    description:
      "Pack alquiler con esquís de gama alta de la temporada, botas, bastones y casco. Ajuste personalizado en tienda al pie de pistas. Cambio de material gratuito si las condiciones cambian.",
    tier: "alta_quality",
    priceType: "per_day",
    price: 49,
    coverImageUrl: IMG.rental,
    sortOrder: 70,
    slug: "",
  },
  {
    category: "alquiler",
    name: "Alquiler equipo completo gama alta — Sierra Nevada",
    station: "Sierra Nevada",
    description:
      "Esquís top, botas, bastones y casco. Material renovado cada temporada. Tienda en Pradollano, recogida y devolución sin colas con reserva online.",
    tier: "alta_quality",
    priceType: "per_day",
    price: 45,
    coverImageUrl: IMG.rental,
    sortOrder: 71,
    slug: "",
  },
  {
    category: "alquiler",
    name: "Alquiler equipo completo gama alta — Formigal",
    station: "Formigal",
    description:
      "Material premium (esquís, botas, bastones, casco) en Formigal. Tienda con servicio de mantenimiento incluido. Posibilidad de probar diferentes modelos durante la estancia.",
    tier: "alta_quality",
    priceType: "per_day",
    price: 42,
    coverImageUrl: IMG.rental,
    sortOrder: 72,
    slug: "",
  },
  {
    category: "alquiler",
    name: "Alquiler equipo completo gama alta — Candanchú",
    station: "Candanchú",
    description:
      "Equipo de gama alta en el Valle del Aragón. Esquís rocker, botas térmicas y casco con homologación. Validez para uso combinado en Astún y Candanchú.",
    tier: "alta_quality",
    priceType: "per_day",
    price: 39,
    coverImageUrl: IMG.rental,
    sortOrder: 73,
    slug: "",
  },
  {
    category: "alquiler",
    name: "Alquiler equipo completo gama alta — La Pinilla",
    station: "La Pinilla",
    description:
      "Material de gama alta en La Pinilla con la mejor relación calidad-precio. Tienda al pie de pistas, ajuste personalizado y casco incluido.",
    tier: "alta_quality",
    priceType: "per_day",
    price: 35,
    coverImageUrl: IMG.rental,
    sortOrder: 74,
    slug: "",
  },
  {
    category: "alquiler",
    name: "Alquiler equipo completo gama media — Sierra Nevada",
    station: "Sierra Nevada",
    description:
      "Pack alquiler económico: esquís de gama media, botas, bastones y casco. Material en buen estado, perfectamente operativo para esquiadores ocasionales.",
    tier: "media_quality",
    priceType: "per_day",
    price: 29,
    coverImageUrl: IMG.rental,
    sortOrder: 80,
    slug: "",
  },
  {
    category: "alquiler",
    name: "Alquiler equipo completo gama media — Formigal",
    station: "Formigal",
    description:
      "Equipo de gama media en Formigal. Esquís, botas y bastones más casco incluido. Buena opción para iniciación o uso esporádico.",
    tier: "media_quality",
    priceType: "per_day",
    price: 27,
    coverImageUrl: IMG.rental,
    sortOrder: 81,
    slug: "",
  },
  {
    category: "alquiler",
    name: "Alquiler equipo completo gama media — La Pinilla",
    station: "La Pinilla",
    description:
      "Material de gama media en La Pinilla. La opción más asequible: esquís, botas, bastones y casco. Cambio de talla incluido durante la estancia.",
    tier: "media_quality",
    priceType: "per_day",
    price: 25,
    coverImageUrl: IMG.rental,
    sortOrder: 82,
    slug: "",
  },
];

// ── APRES-SKI (3) ──
const APRESKI: SeedExperience[] = [
  {
    category: "apreski",
    name: "Cena de après-ski en Baqueira",
    station: "Baqueira Beret",
    description:
      "Cena temática en restaurante de montaña con menú aranés (entrante, principal y postre + bebida). Ambiente animado con DJ y zona chill. Reserva con 24h de antelación.",
    priceType: "fixed",
    price: 49,
    coverImageUrl: IMG.apresSki,
    sortOrder: 90,
    slug: "",
  },
  {
    category: "apreski",
    name: "Tapas tour Granada — Sierra Nevada",
    station: "Sierra Nevada",
    description:
      "Recorrido por 4 bares de tapas en Granada al bajar de la nieve. Incluye 4 tapas + 4 bebidas y guía local. Punto de salida desde Pradollano con autobús.",
    priceType: "fixed",
    price: 39,
    coverImageUrl: IMG.apresSki,
    sortOrder: 91,
    slug: "",
  },
  {
    category: "apreski",
    name: "Termas de Panticosa — Formigal",
    station: "Formigal",
    description:
      "Sesión de 2 horas en el balneario de Panticosa: piscina termal, sauna, hammam y zona de relax. La forma perfecta de cerrar un día en pistas.",
    priceType: "fixed",
    price: 35,
    coverImageUrl: IMG.apresSki,
    sortOrder: 92,
    slug: "",
  },
];

// ── TAQUILLAS (3) ──
const LOCKERS: SeedExperience[] = [
  {
    category: "locker",
    name: "Taquilla diaria — Baqueira Beret",
    station: "Baqueira Beret",
    description:
      "Taquilla con capacidad para equipo completo (esquís, botas, casco y mochila). Acceso ilimitado durante el día. Ubicación a pie de pistas en Cota 1500.",
    priceType: "per_day",
    price: 8,
    coverImageUrl: IMG.lockers,
    sortOrder: 100,
    slug: "",
  },
  {
    category: "locker",
    name: "Taquilla diaria — Sierra Nevada",
    station: "Sierra Nevada",
    description:
      "Taquilla en Pradollano para guardar tu equipo. Ahorra el viaje de subir y bajar el material desde el alojamiento. Acceso por código durante todo el día.",
    priceType: "per_day",
    price: 6,
    coverImageUrl: IMG.lockers,
    sortOrder: 101,
    slug: "",
  },
  {
    category: "locker",
    name: "Taquilla diaria — La Pinilla",
    station: "La Pinilla",
    description:
      "Taquilla a pie de pistas en La Pinilla. Cabe equipo completo más mochila. Acceso libre durante el día con código de apertura.",
    priceType: "per_day",
    price: 5,
    coverImageUrl: IMG.lockers,
    sortOrder: 102,
    slug: "",
  },
];

const ALL: SeedExperience[] = [
  ...PACKS,
  ...HOTEL_FORFAIT,
  ...FORFAITS,
  ...ESCUELA,
  ...CLASE_PARTICULAR,
  ...ALQUILER,
  ...APRESKI,
  ...LOCKERS,
];

// Fill in slugs (must be unique per tenant).
export const SKICENTER_EXPERIENCES: SeedExperience[] = ALL.map((p) => ({
  ...p,
  slug: slugify(p.name),
}));
