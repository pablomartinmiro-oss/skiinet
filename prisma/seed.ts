import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { buildFullCatalog, SEASON_CALENDAR } from "../src/lib/constants/product-catalog";
import {
  DEMO_CONTACTS,
  DEMO_RESERVATIONS,
  DEMO_QUOTES,
  DEMO_DEALS,
  DEMO_CONVERSATIONS,
  DEMO_CAPACITY,
} from "../src/lib/constants/demo-seed-data";
import { seedExtraModules } from "../src/lib/seed/seed-extra-modules";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = {
  "comms:view": "View conversations",
  "comms:send": "Send SMS messages",
  "comms:assign": "Assign/reassign conversations",
  "pipelines:view": "View pipelines and deals",
  "pipelines:edit": "Move deals, edit deal details",
  "pipelines:create": "Create new opportunities",
  "pipelines:delete": "Delete opportunities",
  "analytics:view": "View marketing analytics",
  "analytics:export": "Export analytics data",
  "contacts:view": "View contacts",
  "contacts:edit": "Edit contacts, add notes",
  "contacts:create": "Create new contacts",
  "contacts:delete": "Delete contacts",
  "reservations:view": "View reservations",
  "reservations:create": "Create and confirm reservations",
  "reservations:edit": "Edit and cancel reservations",
  "settings:team": "Manage team members and roles",
  "settings:tenant": "Manage integrations and tenant config",
} as const;

const DEFAULT_ROLES: Record<string, string[]> = {
  "Owner / Manager": Object.keys(PERMISSIONS),
  "Sales Rep": [
    "comms:view", "comms:send", "pipelines:view", "pipelines:edit",
    "pipelines:create", "contacts:view", "reservations:view", "reservations:create",
  ],
  Marketing: ["analytics:view", "analytics:export", "contacts:view"],
  "VA / Admin": [
    "contacts:view", "contacts:edit", "contacts:create",
    "comms:view", "comms:send",
    "reservations:view", "reservations:create", "reservations:edit",
  ],
};

async function seedProducts() {
  const PRODUCTS = buildFullCatalog();
  // Global catalog — delete products with no tenant (shared across all tenants)
  await prisma.product.deleteMany({ where: { tenantId: null } });
  for (const product of PRODUCTS) {
    await prisma.product.create({
      data: {
        category: product.category,
        name: product.name,
        station: product.station,
        description: product.description ?? null,
        personType: product.personType ?? null,
        tier: product.tier ?? null,
        includesHelmet: product.includesHelmet ?? false,
        priceType: product.priceType,
        price: product.price,
        pricingMatrix: JSON.parse(JSON.stringify(product.pricingMatrix)),
        sortOrder: product.sortOrder,
        isActive: true,
      },
    });
  }
  return PRODUCTS.length;
}

async function seedSeasonCalendar(tenantId: string) {
  await prisma.seasonCalendar.deleteMany({ where: { tenantId } });
  for (const entry of SEASON_CALENDAR) {
    await prisma.seasonCalendar.create({
      data: {
        tenantId,
        station: entry.station,
        season: entry.season,
        startDate: new Date(entry.startDate),
        endDate: new Date(entry.endDate),
        label: entry.label,
      },
    });
  }
  return SEASON_CALENDAR.length;
}

async function seedDemoData(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ==================== CONTACTS (50 as CachedContacts) ====================
  await prisma.cachedContact.deleteMany({ where: { tenantId } });
  const contactIds: string[] = [];
  for (let i = 0; i < DEMO_CONTACTS.length; i++) {
    const c = DEMO_CONTACTS[i];
    const id = `demo-contact-${String(i).padStart(3, "0")}`;
    contactIds.push(id);
    await prisma.cachedContact.create({
      data: {
        id,
        tenantId,
        firstName: c.firstName,
        lastName: c.lastName,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        tags: c.tags,
        source: c.source,
        dateAdded: new Date(today.getTime() - Math.random() * 30 * 86400000),
        lastActivity: new Date(today.getTime() - Math.random() * 7 * 86400000),
        dnd: false,
        raw: {},
        cachedAt: new Date(),
      },
    });
  }
  console.log(`Seeded ${contactIds.length} demo contacts`);

  // ==================== RESERVATIONS (50) ====================
  await prisma.reservation.deleteMany({ where: { tenantId } });
  for (const r of DEMO_RESERVATIONS) {
    const c = DEMO_CONTACTS[r.contactIndex];
    const activityDate = new Date(today);
    activityDate.setDate(activityDate.getDate() + r.daysOffset);

    await prisma.reservation.create({
      data: {
        tenantId,
        ghlContactId: contactIds[r.contactIndex],
        clientName: `${c.firstName} ${c.lastName}`,
        clientPhone: c.phone,
        clientEmail: c.email,
        couponCode: r.couponCode ?? null,
        source: r.source,
        station: r.station,
        activityDate,
        schedule: r.schedule,
        totalPrice: r.totalPrice,
        status: r.status,
        paymentMethod: r.paymentMethod ?? null,
        notes: r.notes ?? null,
        services: [{ type: r.services, quantity: 1 }],
        emailSentAt: r.status === "confirmada" ? new Date() : null,
        whatsappSentAt: r.status === "confirmada" ? new Date() : null,
        notificationType: r.status === "confirmada" ? "confirmacion" : null,
        voucherCouponCode: r.couponCode ?? null,
        voucherRedeemed: r.source === "groupon" && r.status === "confirmada",
        voucherRedeemedAt:
          r.source === "groupon" && r.status === "confirmada"
            ? new Date()
            : null,
        voucherPricePaid:
          r.source === "groupon" ? r.totalPrice : null,
      },
    });
  }
  console.log(`Seeded ${DEMO_RESERVATIONS.length} demo reservations`);

  // ==================== QUOTES (12) ====================
  await prisma.quote.deleteMany({ where: { tenantId } });
  for (const q of DEMO_QUOTES) {
    const c = DEMO_CONTACTS[q.contactIndex];
    const checkIn = new Date(today);
    checkIn.setDate(checkIn.getDate() + q.checkIn);
    const checkOut = new Date(today);
    checkOut.setDate(checkOut.getDate() + q.checkOut);

    await prisma.quote.create({
      data: {
        tenantId,
        ghlContactId: contactIds[q.contactIndex],
        clientName: `${c.firstName} ${c.lastName}`,
        clientEmail: c.email,
        clientPhone: c.phone,
        clientNotes: q.notes ?? null,
        destination: q.destination,
        checkIn,
        checkOut,
        adults: q.adults,
        children: q.children,
        wantsForfait: q.wantsForfait,
        wantsClases: q.wantsClases,
        wantsEquipment: q.wantsEquipment,
        status: q.status,
        totalAmount: q.totalAmount,
        sentAt: q.status === "enviado" || q.status === "aceptado"
          ? new Date(today.getTime() - 86400000)
          : null,
        expiresAt: new Date(today.getTime() + 14 * 86400000),
      },
    });
  }
  console.log(`Seeded ${DEMO_QUOTES.length} demo quotes`);

  // ==================== PIPELINE (25 deals) ====================
  await prisma.cachedPipeline.deleteMany({ where: { tenantId } });
  await prisma.cachedOpportunity.deleteMany({ where: { tenantId } });

  const STAGE_MAP: Record<string, { id: string; name: string; position: number }> = {
    nuevo_lead: { id: "demo-stage-1", name: "Nuevo Lead", position: 0 },
    contactado: { id: "demo-stage-2", name: "Contactado", position: 1 },
    presupuesto_enviado: { id: "demo-stage-3", name: "Presupuesto Enviado", position: 2 },
    aceptado: { id: "demo-stage-4", name: "Aceptado", position: 3 },
    cerrado: { id: "demo-stage-5", name: "Cerrado", position: 4 },
  };

  await prisma.cachedPipeline.create({
    data: {
      id: "demo-pipeline-1",
      tenantId,
      name: "Pipeline Comercial",
      stages: Object.values(STAGE_MAP),
      raw: {},
      cachedAt: new Date(),
    },
  });

  for (let i = 0; i < DEMO_DEALS.length; i++) {
    const d = DEMO_DEALS[i];
    const c = DEMO_CONTACTS[d.contactIndex];
    const stage = STAGE_MAP[d.stage];
    await prisma.cachedOpportunity.create({
      data: {
        id: `demo-opp-${String(i).padStart(3, "0")}`,
        tenantId,
        pipelineId: "demo-pipeline-1",
        pipelineStageId: stage.id,
        name: d.name,
        contactId: contactIds[d.contactIndex],
        contactName: `${c.firstName} ${c.lastName}`,
        monetaryValue: d.value,
        status: d.stage === "cerrado" ? "won" : "open",
        raw: {},
        cachedAt: new Date(),
      },
    });
  }
  console.log(`Seeded ${DEMO_DEALS.length} demo pipeline deals`);

  // ==================== CONVERSATIONS (20) ====================
  await prisma.cachedConversation.deleteMany({ where: { tenantId } });
  for (let i = 0; i < DEMO_CONVERSATIONS.length; i++) {
    const conv = DEMO_CONVERSATIONS[i];
    const c = DEMO_CONTACTS[conv.contactIndex];
    const lastMsg = conv.messages[conv.messages.length - 1];
    const lastMsgDate = new Date(Date.now() - lastMsg.minutesAgo * 60000);

    await prisma.cachedConversation.create({
      data: {
        id: `demo-conv-${String(i).padStart(3, "0")}`,
        tenantId,
        contactId: contactIds[conv.contactIndex],
        contactName: `${c.firstName} ${c.lastName}`,
        contactPhone: c.phone,
        contactEmail: c.email,
        lastMessageBody: lastMsg.body,
        lastMessageDate: lastMsgDate,
        lastMessageType: conv.type,
        unreadCount: lastMsg.direction === "inbound" ? 1 : 0,
        raw: { messages: conv.messages.map((m) => ({
          ...m,
          dateAdded: new Date(Date.now() - m.minutesAgo * 60000).toISOString(),
        }))},
        cachedAt: new Date(),
      },
    });
  }
  console.log(`Seeded ${DEMO_CONVERSATIONS.length} demo conversations`);

  // ==================== STATION CAPACITY ====================
  await prisma.stationCapacity.deleteMany({ where: { tenantId } });
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    for (const cap of DEMO_CAPACITY) {
      const factor = d === 0 ? 1 : 0.3 + Math.random() * 0.3;
      await prisma.stationCapacity.create({
        data: {
          tenantId,
          station: cap.station,
          date,
          serviceType: "cursillo_adulto",
          maxCapacity: cap.cursillo_max,
          booked: d === 0
            ? cap.cursillo_booked
            : Math.floor(cap.cursillo_max * factor),
        },
      });
      await prisma.stationCapacity.create({
        data: {
          tenantId,
          station: cap.station,
          date,
          serviceType: "clase_particular",
          maxCapacity: cap.clase_max,
          booked: d === 0
            ? cap.clase_booked
            : Math.floor(cap.clase_max * factor),
        },
      });
    }
  }
  console.log("Seeded station capacity");
}

async function seedNewModules(tenantId: string) {
  // ==================== CATEGORIES ====================
  const catSlugs = ["esqui", "aventura", "bienestar", "gastronomia", "alojamiento"];
  const catNames = ["Esquí", "Aventura", "Bienestar", "Gastronomía", "Alojamiento"];
  for (let i = 0; i < catSlugs.length; i++) {
    await prisma.category.upsert({
      where: { tenantId_slug: { tenantId, slug: catSlugs[i] } },
      update: {},
      create: { tenantId, name: catNames[i], slug: catSlugs[i], sortOrder: i },
    });
  }
  console.log("Seeded 5 categories");

  // ==================== LOCATIONS ====================
  const locData = [
    { slug: "baqueira-beret", name: "Baqueira Beret", lat: 42.6975, lon: 0.9431 },
    { slug: "sierra-nevada", name: "Sierra Nevada", lat: 37.0956, lon: -3.3963 },
    { slug: "la-pinilla", name: "La Pinilla", lat: 41.2342, lon: -3.4906 },
  ];
  for (const loc of locData) {
    await prisma.location.upsert({
      where: { tenantId_slug: { tenantId, slug: loc.slug } },
      update: {},
      create: { tenantId, name: loc.name, slug: loc.slug, latitude: loc.lat, longitude: loc.lon },
    });
  }
  console.log("Seeded 3 locations");

  // ==================== HOTEL ====================
  const roomTypes = [
    { slug: "doble", title: "Habitación Doble", capacity: 2, basePrice: 120 },
    { slug: "suite-junior", title: "Suite Junior", capacity: 2, basePrice: 180 },
    { slug: "suite-familiar", title: "Suite Familiar", capacity: 4, basePrice: 250 },
  ];
  const rtIds: string[] = [];
  for (const rt of roomTypes) {
    const room = await prisma.roomType.upsert({
      where: { tenantId_slug: { tenantId, slug: rt.slug } },
      update: {},
      create: { tenantId, title: rt.title, slug: rt.slug, capacity: rt.capacity, basePrice: rt.basePrice, images: JSON.parse("[]") },
    });
    rtIds.push(room.id);
  }

  const seasons = [
    { name: "Temporada Alta", ranges: [["2026-12-20", "2027-01-06"], ["2027-02-15", "2027-02-28"]] },
    { name: "Temporada Media", ranges: [["2027-01-07", "2027-02-14"], ["2027-03-01", "2027-04-15"]] },
  ];
  const seasonIds: string[] = [];
  for (const s of seasons) {
    // Use first range start as unique identifier
    const season = await prisma.roomRateSeason.create({
      data: { tenantId, name: s.name, startDate: new Date(s.ranges[0][0]), endDate: new Date(s.ranges[0][1]) },
    });
    seasonIds.push(season.id);
  }

  // Rates: room type x season x 7 days
  const multipliers = [1.0, 1.5]; // media, alta
  for (let ri = 0; ri < rtIds.length; ri++) {
    for (let si = 0; si < seasonIds.length; si++) {
      for (let dow = 0; dow < 7; dow++) {
        const base = roomTypes[ri].basePrice * multipliers[si];
        const weekendBump = dow === 5 || dow === 6 ? 20 : 0;
        await prisma.roomRate.upsert({
          where: { tenantId_roomTypeId_seasonId_dayOfWeek: { tenantId, roomTypeId: rtIds[ri], seasonId: seasonIds[si], dayOfWeek: dow } },
          update: {},
          create: { tenantId, roomTypeId: rtIds[ri], seasonId: seasonIds[si], dayOfWeek: dow, price: base + weekendBump },
        });
      }
    }
  }
  console.log("Seeded hotel: 3 room types, 2 seasons, 42 rates");

  // ==================== RESTAURANT ====================
  const restaurant = await prisma.restaurant.upsert({
    where: { tenantId_slug: { tenantId, slug: "el-mirador" } },
    update: {},
    create: { tenantId, title: "El Mirador", slug: "el-mirador", capacity: 60, operatingDays: JSON.parse("[1,2,3,4,5,6,0]") },
  });
  const shifts = [
    { name: "Almuerzo", startTime: "13:00", endTime: "15:30", maxCapacity: 60, duration: 90 },
    { name: "Cena", startTime: "20:00", endTime: "23:00", maxCapacity: 50, duration: 120 },
  ];
  for (const sh of shifts) {
    // Delete existing to avoid duplicates, then create
    await prisma.restaurantShift.deleteMany({ where: { tenantId, restaurantId: restaurant.id, name: sh.name } });
    await prisma.restaurantShift.create({
      data: { tenantId, restaurantId: restaurant.id, ...sh },
    });
  }
  console.log("Seeded restaurant: El Mirador + 2 shifts");

  // ==================== SPA ====================
  const spaCats = [
    { slug: "masajes", name: "Masajes" },
    { slug: "faciales", name: "Faciales" },
  ];
  const spaCatIds: Record<string, string> = {};
  for (let i = 0; i < spaCats.length; i++) {
    const cat = await prisma.spaCategory.upsert({
      where: { tenantId_slug: { tenantId, slug: spaCats[i].slug } },
      update: {},
      create: { tenantId, name: spaCats[i].name, slug: spaCats[i].slug, sortOrder: i },
    });
    spaCatIds[spaCats[i].slug] = cat.id;
  }
  const treatments = [
    { slug: "masaje-relajante", title: "Masaje Relajante", catSlug: "masajes", duration: 60, price: 80 },
    { slug: "masaje-deportivo", title: "Masaje Deportivo", catSlug: "masajes", duration: 45, price: 70 },
    { slug: "facial-hidratante", title: "Facial Hidratante", catSlug: "faciales", duration: 30, price: 55 },
  ];
  for (const t of treatments) {
    await prisma.spaTreatment.upsert({
      where: { tenantId_slug: { tenantId, slug: t.slug } },
      update: {},
      create: { tenantId, categoryId: spaCatIds[t.catSlug], title: t.title, slug: t.slug, duration: t.duration, price: t.price, images: JSON.parse("[]") },
    });
  }
  const spaResources = [
    { type: "cabin", name: "Cabina 1" },
    { type: "therapist", name: "María López" },
  ];
  for (const r of spaResources) {
    const existing = await prisma.spaResource.findFirst({ where: { tenantId, name: r.name } });
    if (!existing) {
      await prisma.spaResource.create({ data: { tenantId, type: r.type, name: r.name } });
    }
  }
  console.log("Seeded spa: 2 categories, 3 treatments, 2 resources");

  // ==================== FINANCE ====================
  const costCenters = [
    { code: "OP", name: "Operaciones" },
    { code: "ADM", name: "Administración" },
  ];
  for (const cc of costCenters) {
    await prisma.costCenter.upsert({
      where: { tenantId_code: { tenantId, code: cc.code } },
      update: {},
      create: { tenantId, name: cc.name, code: cc.code },
    });
  }
  const expCategories = [
    { code: "PER", name: "Personal" },
    { code: "SUM", name: "Suministros" },
    { code: "MKT", name: "Marketing" },
  ];
  for (const ec of expCategories) {
    await prisma.expenseCategory.upsert({
      where: { tenantId_code: { tenantId, code: ec.code } },
      update: {},
      create: { tenantId, name: ec.name, code: ec.code },
    });
  }
  console.log("Seeded finance: 2 cost centers, 3 expense categories");

  // ==================== CMS ====================
  await prisma.slideshowItem.deleteMany({ where: { tenantId } });
  const slideshow = [
    { imageUrl: "https://placehold.co/1200x400/E87B5A/white?text=Bienvenido+a+Skicenter", caption: "Bienvenido a Skicenter", sortOrder: 0 },
    { imageUrl: "https://placehold.co/1200x400/5B8C6D/white?text=Esquí+y+Aventura", caption: "Esquí y Aventura", sortOrder: 1 },
    { imageUrl: "https://placehold.co/1200x400/D4A853/white?text=Spa+y+Bienestar", caption: "Spa y Bienestar", sortOrder: 2 },
  ];
  for (const s of slideshow) {
    await prisma.slideshowItem.create({ data: { tenantId, ...s } });
  }
  await prisma.cmsMenuItem.deleteMany({ where: { tenantId } });
  const menuItems = [
    { label: "Inicio", url: "/", position: "header", sortOrder: 0 },
    { label: "Experiencias", url: "/experiencias", position: "header", sortOrder: 1 },
  ];
  for (const mi of menuItems) {
    await prisma.cmsMenuItem.create({ data: { tenantId, ...mi } });
  }
  console.log("Seeded CMS: 3 slideshow items, 2 menu items");

  // Enable new modules
  const newModules = ["catalog", "booking", "hotel", "spa", "restaurant", "finance", "cms"];
  for (const mod of newModules) {
    await prisma.moduleConfig.upsert({
      where: { tenantId_module: { tenantId, module: mod } },
      update: {},
      create: { tenantId, module: mod, isEnabled: true },
    });
  }
  // ==================== INSTRUCTORS ====================
  const profesorUser = await prisma.user.findFirst({ where: { tenantId, email: "profesor@demo.skicenter.com" } });
  const nataliaUser = await prisma.user.findFirst({ where: { tenantId, email: "natalia@demo.skicenter.com" } });
  const carlosUser = await prisma.user.findFirst({ where: { tenantId, email: "manager@demo.skicenter.com" } });
  const demoUsers = [profesorUser, nataliaUser, carlosUser].filter(Boolean);
  if (demoUsers.length >= 3) {
    const instructorData = [
      { userId: demoUsers[0]!.id, tdLevel: "TD3", station: "baqueira", disciplines: ["esqui", "snow"], languages: ["es", "en", "fr"], hourlyRate: 28, perStudentBonus: 3, certNumber: "TD3-2024-0412", contractType: "fijo_discontinuo" },
      { userId: demoUsers[1]!.id, tdLevel: "TD2", station: "baqueira", disciplines: ["esqui"], languages: ["es", "en"], hourlyRate: 22, perStudentBonus: 2.5, certNumber: "TD2-2023-1087", contractType: "fijo_discontinuo" },
      { userId: demoUsers[2]!.id, tdLevel: "TD1", station: "baqueira", disciplines: ["snow", "freestyle"], languages: ["es", "de"], hourlyRate: 18, perStudentBonus: 2, certNumber: "TD1-2025-0203", contractType: "temporal" },
    ];
    const instructorIds: string[] = [];
    for (const data of instructorData) {
      const inst = await prisma.instructor.upsert({
        where: { tenantId_userId: { tenantId, userId: data.userId } },
        update: {},
        create: { tenantId, ...data, specialties: [], isActive: true },
      });
      instructorIds.push(inst.id);
      for (let day = 1; day <= 6; day++) {
        await prisma.instructorAvailability.upsert({
          where: { tenantId_instructorId_dayOfWeek: { tenantId, instructorId: inst.id, dayOfWeek: day } },
          update: {},
          create: { tenantId, instructorId: inst.id, dayOfWeek: day, startTime: "09:00", endTime: "17:00", isActive: true },
        });
      }
    }

    // Seed time entries for past 7 days
    await prisma.instructorTimeEntry.deleteMany({ where: { tenantId } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let dayOff = 0; dayOff < 7; dayOff++) {
      const d = new Date(today);
      d.setDate(d.getDate() - dayOff);
      if (d.getDay() === 0) continue; // skip Sunday
      for (const instId of instructorIds) {
        const clockIn = new Date(d);
        clockIn.setHours(8, 45 + Math.floor(Math.random() * 15), 0, 0);
        const clockOut = dayOff === 0 ? null : new Date(d);
        if (clockOut) clockOut.setHours(16, 30 + Math.floor(Math.random() * 30), 0, 0);
        const totalMin = clockOut ? Math.round((clockOut.getTime() - clockIn.getTime()) / 60000) : 0;
        const breakMin = clockOut ? 45 : 0;
        const netMin = Math.max(0, totalMin - breakMin);
        await prisma.instructorTimeEntry.create({
          data: {
            tenantId, instructorId: instId, date: d, clockIn, clockOut,
            totalMinutes: totalMin, breakMinutes: breakMin, netMinutes: netMin,
            source: "mobile",
            lockedAt: dayOff > 1 ? new Date() : null,
            lockedBy: dayOff > 1 ? "system" : null,
          },
        });
      }
    }

    // Create ActivityBookings + Assignments from confirmed reservations
    await prisma.instructorAssignment.deleteMany({ where: { tenantId } });
    await prisma.activityBooking.deleteMany({ where: { tenantId } });
    const confirmedRes = await prisma.reservation.findMany({
      where: { tenantId, status: "confirmada" },
      take: 15,
      orderBy: { activityDate: "asc" },
    });
    const lessonTypes = ["group", "private", "group", "group", "adaptive"];
    const schedules = [
      { start: "09:15", end: "12:00" },
      { start: "10:00", end: "12:00" },
      { start: "13:00", end: "16:00" },
      { start: "09:15", end: "12:15" },
      { start: "13:00", end: "15:00" },
    ];
    for (let i = 0; i < confirmedRes.length; i++) {
      const res = confirmedRes[i];
      const booking = await prisma.activityBooking.create({
        data: {
          tenantId,
          reservationId: res.id,
          activityDate: res.activityDate,
          status: res.activityDate < today ? "confirmed" : "scheduled",
          arrivedClient: res.activityDate < today,
        },
      });
      const instIdx = i % instructorIds.length;
      const sched = schedules[i % schedules.length];
      const lt = lessonTypes[i % lessonTypes.length];
      const studentCount = lt === "group" ? 3 + Math.floor(Math.random() * 5) : lt === "private" ? 1 : 2;
      const inst = instructorData[instIdx];
      await prisma.instructorAssignment.create({
        data: {
          tenantId,
          instructorId: instructorIds[instIdx],
          bookingId: booking.id,
          lessonType: lt,
          studentCount,
          scheduledStart: sched.start,
          scheduledEnd: sched.end,
          hourlyRate: inst.hourlyRate,
          bonusPerStudent: inst.perStudentBonus,
          surcharge: lt === "adaptive" ? 8 : 0,
          surchargeReason: lt === "adaptive" ? "Clase adaptativa" : null,
          status: res.activityDate < today ? "completed" : "assigned",
          completedAt: res.activityDate < today ? res.activityDate : null,
        },
      });
    }
    console.log("Seeded 3 instructors, time entries, activity bookings & assignments");
  }

  // ==================== RENTAL ====================
  // Rental tables may not exist yet (migration pending — tracked separately)
  try {
  await prisma.rentalInventory.deleteMany({ where: { tenantId } });
  await prisma.rentalOrderItem.deleteMany({
    where: { rentalOrder: { tenantId } },
  });
  await prisma.rentalOrder.deleteMany({ where: { tenantId } });
  await prisma.customerSizingProfile.deleteMany({ where: { tenantId } });

  const { buildRentalInventorySeed, RENTAL_ORDERS_SEED, SIZING_PROFILES_SEED } = await import("../src/lib/constants/rental-seed-data");

  // Seed inventory
  const inventorySeed = buildRentalInventorySeed();
  for (const inv of inventorySeed) {
    await prisma.rentalInventory.create({
      data: { tenantId, ...inv },
    });
  }
  console.log(`Seeded ${inventorySeed.length} rental inventory entries`);

  // Seed rental orders
  const rentalToday = new Date();
  rentalToday.setHours(0, 0, 0, 0);
  for (const orderSeed of RENTAL_ORDERS_SEED) {
    const pickupDate = new Date(rentalToday);
    pickupDate.setDate(pickupDate.getDate() + orderSeed.pickupDaysOffset);
    const returnDate = new Date(rentalToday);
    returnDate.setDate(returnDate.getDate() + orderSeed.returnDaysOffset);

    const order = await prisma.rentalOrder.create({
      data: {
        tenantId,
        clientName: orderSeed.clientName,
        clientEmail: orderSeed.clientEmail,
        clientPhone: orderSeed.clientPhone,
        stationSlug: orderSeed.stationSlug,
        pickupDate,
        returnDate,
        status: orderSeed.status,
        totalPrice: orderSeed.totalPrice,
        paymentStatus: orderSeed.paymentStatus,
        pickedUpAt: orderSeed.status === "PICKED_UP" || orderSeed.status === "RETURNED" ? pickupDate : null,
        returnedAt: orderSeed.status === "RETURNED" ? returnDate : null,
        cancelledAt: orderSeed.status === "CANCELLED" ? rentalToday : null,
      },
    });

    for (const itemSeed of orderSeed.items) {
      await prisma.rentalOrderItem.create({
        data: {
          rentalOrderId: order.id,
          participantName: itemSeed.participantName,
          equipmentType: itemSeed.equipmentType,
          size: itemSeed.size,
          qualityTier: itemSeed.qualityTier,
          dinSetting: itemSeed.dinSetting,
          itemStatus: itemSeed.itemStatus,
          conditionOnReturn: itemSeed.conditionOnReturn,
          unitPrice: itemSeed.unitPrice,
        },
      });
    }
  }
  console.log(`Seeded ${RENTAL_ORDERS_SEED.length} rental orders`);

  // Seed sizing profiles
  for (const profile of SIZING_PROFILES_SEED) {
    await prisma.customerSizingProfile.create({
      data: { tenantId, ...profile },
    });
  }
  console.log(`Seeded ${SIZING_PROFILES_SEED.length} sizing profiles`);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2021") {
      const model = "meta" in e && e.meta && typeof e.meta === "object" && "modelName" in e.meta ? (e.meta as { modelName: string }).modelName : "unknown";
      console.warn(`⚠ Skipping Rental seed: table for ${model} does not exist yet (P2021)`);
    } else {
      throw e;
    }
  }

  // Enable additional modules
  const extraModules = ["suppliers", "storefront", "reviews", "ticketing", "packs", "instructors", "rental"];
  for (const mod of extraModules) {
    await prisma.moduleConfig.upsert({
      where: { tenantId_module: { tenantId, module: mod } },
      update: {},
      create: { tenantId, module: mod, isEnabled: true },
    });
  }
  console.log("Enabled new modules for demo tenant");
}

async function seedCatalogEnrichment() {
  // PORT-04: Add slugs and enrichment fields to a few global products for storefront demo
  const slugMap = [
    { namePrefix: "Forfait Baqueira", slug: "forfait-baqueira-adulto", productType: "experiencia", isFeatured: true },
    { namePrefix: "Clases Esquí Grupo", slug: "clase-esqui-grupo", productType: "actividad", fiscalRegime: "reav" },
    { namePrefix: "Equipo Esquí Adulto Media", slug: "alquiler-esqui-adulto-media", productType: "alquiler" },
    { namePrefix: "SnowCamp Full Day", slug: "snowcamp-full-day", productType: "actividad", isFeatured: true },
    { namePrefix: "Transfer Aeropuerto", slug: "transfer-aeropuerto", productType: "transporte" },
  ];
  let updated = 0;
  for (const entry of slugMap) {
    const product = await prisma.product.findFirst({
      where: { tenantId: null, name: { startsWith: entry.namePrefix } },
    });
    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          slug: entry.slug,
          productType: entry.productType ?? null,
          fiscalRegime: entry.fiscalRegime ?? "general",
          isFeatured: entry.isFeatured ?? false,
          isPublished: true,
        },
      });
      updated++;
    }
  }
  if (updated > 0) console.log(`Enriched ${updated} global products with slugs`);
}

async function seedCmsEnhancement(tenantId: string) {
  // PORT-05: Gallery items
  await prisma.galleryItem.deleteMany({ where: { tenantId } });
  const galleryItems = [
    { imageUrl: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800", title: "Pistas de Baqueira", category: "estacion", sortOrder: 0 },
    { imageUrl: "https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800", title: "Clases de esquí", category: "actividades", sortOrder: 1 },
    { imageUrl: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=800", title: "Snowboard freestyle", category: "actividades", sortOrder: 2 },
    { imageUrl: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800", title: "Après-ski", category: "experiencias", sortOrder: 3 },
    { imageUrl: "https://images.unsplash.com/photo-1520962922320-2038eebab146?w=800", title: "Paisaje invernal", category: "estacion", sortOrder: 4 },
  ];
  for (const g of galleryItems) {
    await prisma.galleryItem.create({ data: { tenantId, isActive: true, ...g } });
  }
  console.log(`Seeded ${galleryItems.length} gallery items`);

  // PORT-05: Enrich existing slideshow items
  const slides = await prisma.slideshowItem.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" }, take: 3 });
  const slideEnrichments = [
    { badge: "Temporada 2026", title: "Vive la montaña", subtitle: "Esquí, snowboard y más", ctaText: "Reservar ahora", ctaUrl: "/reservas" },
    { badge: "Nuevo", title: "SnowCamp infantil", subtitle: "Diversión garantizada", ctaText: "Ver precios", ctaUrl: "/catalogo" },
    { title: "Clases particulares", subtitle: "Aprende con los mejores monitores", ctaText: "Más info", ctaUrl: "/catalogo" },
  ];
  for (let i = 0; i < Math.min(slides.length, slideEnrichments.length); i++) {
    await prisma.slideshowItem.update({ where: { id: slides[i].id }, data: slideEnrichments[i] });
  }
  if (slides.length > 0) console.log(`Enriched ${Math.min(slides.length, slideEnrichments.length)} slideshow items`);

  // PORT-05: Home module items (link to first few products)
  await prisma.homeModuleItem.deleteMany({ where: { tenantId } });
  const products = await prisma.product.findMany({ where: { OR: [{ tenantId }, { tenantId: null }] }, take: 6, orderBy: { sortOrder: "asc" } });
  const moduleKeys = ["featured", "popular", "seasonal"] as const;
  let moduleCount = 0;
  for (let i = 0; i < Math.min(products.length, 6); i++) {
    await prisma.homeModuleItem.create({
      data: { tenantId, moduleKey: moduleKeys[i % 3], productId: products[i].id, sortOrder: Math.floor(i / 3) },
    });
    moduleCount++;
  }
  console.log(`Seeded ${moduleCount} home module items`);
}

async function seedDemoContent(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ==================== SPA SLOTS (5 for today) ====================
  await prisma.spaSlot.deleteMany({ where: { tenantId, date: today } });
  const allTreatments = await prisma.spaTreatment.findMany({ where: { tenantId } });
  const slotTimes = ["10:00", "11:30", "14:00", "16:00", "17:30"];
  let slotCount = 0;
  for (let i = 0; i < Math.min(allTreatments.length, 3); i++) {
    const t = allTreatments[i];
    const t1 = slotTimes[i * 2 % slotTimes.length];
    const t2 = slotTimes[(i * 2 + 1) % slotTimes.length];
    for (const time of [t1, t2]) {
      const booked = Math.random() > 0.5 ? 1 : 0;
      await prisma.spaSlot.create({
        data: { tenantId, date: today, time, treatmentId: t.id, capacity: 1, booked, status: booked ? "full" : "available" },
      });
      slotCount++;
    }
  }
  console.log(`Seeded ${slotCount} spa slots for today`);

  // ==================== RESTAURANT BOOKINGS (5 for today) ====================
  await prisma.restaurantBooking.deleteMany({ where: { tenantId, date: today } });
  const restaurant = await prisma.restaurant.findFirst({ where: { tenantId } });
  if (restaurant) {
    const bookings = [
      { time: "13:30", guestCount: 2, status: "confirmed", notes: "Mesa junto a ventana" },
      { time: "14:00", guestCount: 4, status: "confirmed", notes: null },
      { time: "14:30", guestCount: 6, status: "no_show", notes: "Cumpleaños — tarta especial" },
      { time: "20:30", guestCount: 3, status: "confirmed", notes: "Alergia a frutos secos" },
      { time: "21:00", guestCount: 2, status: "confirmed", notes: null },
    ];
    for (const b of bookings) {
      await prisma.restaurantBooking.create({
        data: {
          tenantId, restaurantId: restaurant.id, date: today,
          time: b.time, guestCount: b.guestCount, status: b.status,
          specialRequests: b.notes, depositStatus: "paid",
        },
      });
    }
    console.log("Seeded 5 restaurant bookings for today");
  }

  // ==================== INVOICES + LINES + TRANSACTION ====================
  await prisma.invoiceLine.deleteMany({ where: { tenantId } });
  await prisma.transaction.deleteMany({ where: { tenantId } });
  await prisma.invoice.deleteMany({ where: { tenantId } });

  const invoices = [
    { number: "FAC-2026-0001", status: "paid", subtotal: 413.22, taxAmount: 86.78, total: 500, issuedAt: new Date("2026-03-15"), paidAt: new Date("2026-03-20"), notes: null,
      lines: [{ description: "Alquiler equipo esquí adulto — 5 días", quantity: 2, unitPrice: 180, lineTotal: 360 }, { description: "Seguro daños equipo", quantity: 2, unitPrice: 20.66, lineTotal: 41.32 }] },
    { number: "FAC-2026-0002", status: "sent", subtotal: 991.74, taxAmount: 208.26, total: 1200, issuedAt: new Date("2026-03-28"), paidAt: null, notes: "Familia López — 2 adultos, 2 niños",
      lines: [{ description: "Pack Aventura Familiar (4 pax)", quantity: 1, unitPrice: 991.74, lineTotal: 991.74 }] },
    { number: "FAC-2026-0003", status: "draft", subtotal: 132.23, taxAmount: 27.77, total: 160, issuedAt: null, paidAt: null, notes: null,
      lines: [{ description: "Masaje Relajante 60 min", quantity: 2, unitPrice: 66.12, lineTotal: 132.23 }] },
  ];
  for (const inv of invoices) {
    const { lines, ...invData } = inv;
    const created = await prisma.invoice.create({ data: { tenantId, ...invData } });
    for (const line of lines) {
      await prisma.invoiceLine.create({ data: { tenantId, invoiceId: created.id, ...line, taxRate: 21 } });
    }
    if (inv.status === "paid") {
      await prisma.transaction.create({
        data: { tenantId, invoiceId: created.id, date: inv.paidAt!, amount: inv.total, method: "card", status: "completed", reference: "TPV-00412" },
      });
    }
  }
  console.log("Seeded 3 invoices with lines + 1 transaction");

  // ==================== EXPENSES (3) ====================
  await prisma.expense.deleteMany({ where: { tenantId } });
  const expCats = await prisma.expenseCategory.findMany({ where: { tenantId } });
  const costCenters = await prisma.costCenter.findMany({ where: { tenantId } });
  const catMap: Record<string, string> = {};
  for (const ec of expCats) catMap[ec.code] = ec.id;
  const ccOp = costCenters.find((c) => c.code === "OP");
  const ccAdm = costCenters.find((c) => c.code === "ADM");

  const expenses = [
    { concept: "Electricidad marzo", amount: 450, categoryCode: "SUM", costCenterId: ccOp?.id ?? null, status: "accounted", paymentMethod: "direct_debit", date: new Date("2026-03-31") },
    { concept: "Nóminas marzo", amount: 12000, categoryCode: "PER", costCenterId: ccAdm?.id ?? null, status: "justified", paymentMethod: "transfer", date: new Date("2026-03-31") },
    { concept: "Campaña Google Ads", amount: 800, categoryCode: "MKT", costCenterId: null, status: "pending", paymentMethod: "card", date: new Date("2026-03-25") },
  ];
  for (const exp of expenses) {
    const { categoryCode, ...data } = exp;
    await prisma.expense.create({ data: { tenantId, categoryId: catMap[categoryCode], ...data } });
  }
  console.log("Seeded 3 expenses");

  // ==================== SUPPLIERS (2) ====================
  const suppliers = [
    { fiscalName: "Aventura Total S.L.", nif: "B12345678", email: "admin@aventuratotal.es", phone: "+34 974 123 456", commissionPercentage: 15, status: "active" },
    { fiscalName: "Sierra Nevada Sports", nif: "B87654321", email: "contacto@snsports.es", phone: "+34 958 654 321", commissionPercentage: 10, status: "active" },
  ];
  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { tenantId_nif: { tenantId, nif: s.nif } },
      update: {},
      create: { tenantId, ...s },
    });
  }
  console.log("Seeded 2 suppliers");

  // ==================== DISCOUNT CODES (2) ====================
  const discounts = [
    { code: "BIENVENIDO10", type: "percentage", value: 10, maxUses: 100, isActive: true, expirationDate: null },
    { code: "VERANO2026", type: "fixed", value: 20, maxUses: 0, isActive: true, expirationDate: new Date("2026-09-30") },
  ];
  for (const d of discounts) {
    await prisma.discountCode.upsert({
      where: { tenantId_code: { tenantId, code: d.code } },
      update: {},
      create: { tenantId, ...d },
    });
  }
  console.log("Seeded 2 discount codes");

  // ==================== REVIEWS (4) ====================
  await prisma.review.deleteMany({ where: { tenantId } });
  const reviews = [
    { entityType: "experience", entityId: "baqueira-esqui", rating: 5, authorName: "Laura Fernández", authorEmail: "laura@email.com", title: "Increíble experiencia", body: "Las pistas estaban en perfecto estado y el equipo de alquiler era de gran calidad. Repetiremos seguro.", status: "approved", stayDate: new Date("2026-02-15") },
    { entityType: "hotel", entityId: "suite-familiar", rating: 4, authorName: "Miguel Ángel Ruiz", authorEmail: "miguel@email.com", title: "Muy buena relación calidad-precio", body: "La suite familiar era espaciosa y limpia. El desayuno buffet excelente. Solo faltaba un poco más de presión en la ducha.", status: "approved", stayDate: new Date("2026-03-01") },
    { entityType: "spa", entityId: "masaje-deportivo", rating: 3, authorName: "Ana Belén Torres", authorEmail: "anabelen@email.com", title: "Correcto pero mejorable", body: "El masaje estuvo bien pero la sala estaba un poco fría. El terapeuta fue amable.", status: "pending", stayDate: new Date("2026-03-10") },
    { entityType: "restaurant", entityId: "el-mirador", rating: 1, authorName: "Pedro García", authorEmail: "pedro@email.com", title: "Muy decepcionante", body: "Esperamos 45 minutos para que nos sirvieran y la comida llegó fría.", status: "rejected", stayDate: new Date("2026-03-05") },
  ];
  for (const r of reviews) {
    await prisma.review.create({ data: { tenantId, ...r } });
  }
  console.log("Seeded 4 reviews");

  // ==================== CMS STATIC PAGES (2) ====================
  const pages = [
    { title: "Sobre nosotros", slug: "sobre-nosotros", isPublished: true, metaDescription: "Conoce la historia de Skicenter, tu centro de esquí de confianza.",
      content: "<h2>Nuestra historia</h2><p>Skicenter nació en 2018 con la misión de hacer accesible el esquí y los deportes de montaña a todo el mundo. Desde nuestras tres estaciones — Baqueira Beret, Sierra Nevada y La Pinilla — ofrecemos experiencias inolvidables para familias, parejas y grupos de amigos.</p><p>Nuestro equipo de más de 30 profesionales se dedica a que cada cliente disfrute al máximo de la nieve, el bienestar y la gastronomía de montaña.</p>",
      blocks: [{ type: "text", content: { html: "<p>Contacto: info@skicenter.com | +34 900 123 456</p>" }, sortOrder: 0 }] },
    { title: "Política de cancelación", slug: "politica-cancelacion", isPublished: true, metaDescription: "Consulta nuestra política de cancelación y devoluciones.",
      content: "<h2>Política de cancelación</h2><p>Las reservas pueden cancelarse gratuitamente hasta 48 horas antes de la fecha de actividad. Cancelaciones con menos de 48 horas de antelación tendrán un cargo del 50% del importe total.</p><p>En caso de condiciones meteorológicas adversas que impidan la realización de la actividad, se ofrecerá un bono de compensación por el 100% del importe.</p>",
      blocks: [{ type: "text", content: { html: "<p>Última actualización: marzo 2026</p>" }, sortOrder: 0 }] },
  ];
  for (const p of pages) {
    const { blocks, ...pageData } = p;
    const page = await prisma.staticPage.upsert({
      where: { tenantId_slug: { tenantId, slug: p.slug } },
      update: {},
      create: { tenantId, ...pageData },
    });
    // Upsert blocks: delete existing then recreate
    await prisma.pageBlock.deleteMany({ where: { tenantId, pageId: page.id } });
    for (const block of blocks) {
      await prisma.pageBlock.create({ data: { tenantId, pageId: page.id, type: block.type, content: block.content, sortOrder: block.sortOrder } });
    }
  }
  console.log("Seeded 2 static pages with blocks");
}

async function seedSierraSkiTenant() {
  // Second tenant for proving multi-tenant isolation. Idempotent — safe to re-run.
  const tenant = await prisma.tenant.upsert({
    where: { slug: "sierra-ski" },
    update: { isDemo: false, dataMode: "mock" },
    create: {
      name: "Sierra Ski School",
      slug: "sierra-ski",
      onboardingComplete: true,
      isDemo: false,
      dataMode: "mock",
    },
  });

  const ownerRole = await prisma.role.upsert({
    where: { name_tenantId: { name: "Owner / Manager", tenantId: tenant.id } },
    update: {},
    create: {
      name: "Owner / Manager",
      tenantId: tenant.id,
      isSystem: true,
      permissions: DEFAULT_ROLES["Owner / Manager"],
    },
  });

  const pw = await hash("test1234", 12);
  await prisma.user.upsert({
    where: { email_tenantId: { email: "sierra@test.com", tenantId: tenant.id } },
    update: {},
    create: {
      email: "sierra@test.com",
      name: "Sierra Owner",
      passwordHash: pw,
      tenantId: tenant.id,
      roleId: ownerRole.id,
    },
  });

  // Modules: core (always on) + catalog, booking, storefront, rental, finance
  const enabledModules = ["catalog", "booking", "storefront", "rental", "finance"];
  for (const mod of enabledModules) {
    await prisma.moduleConfig.upsert({
      where: { tenantId_module: { tenantId: tenant.id, module: mod } },
      update: { isEnabled: true },
      create: { tenantId: tenant.id, module: mod, isEnabled: true },
    });
  }

  // Tenant-specific site settings
  const siteSettings = [
    { key: "contact_email", value: { value: "info@sierraski.test" } },
    { key: "contact_phone", value: { value: "+34 958 000 111" } },
    { key: "site_title", value: { value: "Sierra Ski School" } },
  ];
  for (const s of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: s.key } },
      update: { value: s.value },
      create: { tenantId: tenant.id, key: s.key, value: s.value },
    });
  }

  // 2 categories
  const categories = [
    { slug: "esqui", name: "Esquí" },
    { slug: "alquiler", name: "Alquiler" },
  ];
  for (let i = 0; i < categories.length; i++) {
    await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: categories[i].slug } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: categories[i].name,
        slug: categories[i].slug,
        sortOrder: i,
      },
    });
  }

  // 7 tenant-scoped products (skicenter's are global; these are sierra-ski only)
  const sierraProducts = [
    { slug: "sierra-clase-grupo", name: "Clase de Esquí Grupo (Sierra)", category: "escuela", station: "sierra_nevada", priceType: "per_session", price: 45, productType: "actividad" },
    { slug: "sierra-clase-particular", name: "Clase Particular 1h (Sierra)", category: "clase_particular", station: "sierra_nevada", priceType: "per_person_per_hour", price: 60, productType: "actividad" },
    { slug: "sierra-alquiler-esqui-adulto", name: "Alquiler Esquí Adulto (Sierra)", category: "alquiler", station: "sierra_nevada", priceType: "per_day", price: 28, productType: "alquiler" },
    { slug: "sierra-alquiler-snow-adulto", name: "Alquiler Snow Adulto (Sierra)", category: "alquiler", station: "sierra_nevada", priceType: "per_day", price: 30, productType: "alquiler" },
    { slug: "sierra-forfait-1d", name: "Forfait Sierra Nevada 1 Día", category: "forfait", station: "sierra_nevada", priceType: "per_day", price: 56, productType: "experiencia" },
    { slug: "sierra-forfait-3d", name: "Forfait Sierra Nevada 3 Días", category: "forfait", station: "sierra_nevada", priceType: "per_day", price: 162, productType: "experiencia" },
    { slug: "sierra-locker", name: "Taquilla Diaria (Sierra)", category: "locker", station: "sierra_nevada", priceType: "per_day", price: 6, productType: "otro" },
  ];
  for (const p of sierraProducts) {
    const existing = await prisma.product.findFirst({
      where: { tenantId: tenant.id, slug: p.slug },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          tenantId: tenant.id,
          slug: p.slug,
          name: p.name,
          category: p.category,
          station: p.station,
          priceType: p.priceType,
          price: p.price,
          productType: p.productType,
          isActive: true,
          isPublished: true,
        },
      });
    }
  }

  // Sample quote (idempotent via clientEmail uniqueness check)
  const sampleQuote = await prisma.quote.findFirst({
    where: { tenantId: tenant.id, clientEmail: "test-cliente@sierraski.test" },
  });
  if (!sampleQuote) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.quote.create({
      data: {
        tenantId: tenant.id,
        clientName: "Cliente Sierra",
        clientEmail: "test-cliente@sierraski.test",
        clientPhone: "+34 600 111 222",
        destination: "sierra_nevada",
        checkIn: new Date(today.getTime() + 14 * 86400000),
        checkOut: new Date(today.getTime() + 17 * 86400000),
        adults: 2,
        children: 0,
        wantsForfait: true,
        wantsClases: true,
        status: "borrador",
        totalAmount: 380,
        expiresAt: new Date(today.getTime() + 14 * 86400000),
      },
    });
  }

  // Sample reservation
  const sampleRes = await prisma.reservation.findFirst({
    where: { tenantId: tenant.id, clientEmail: "test-reserva@sierraski.test" },
  });
  if (!sampleRes) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        clientName: "Reserva Sierra",
        clientEmail: "test-reserva@sierraski.test",
        clientPhone: "+34 600 333 444",
        source: "web",
        station: "sierra_nevada",
        activityDate: new Date(today.getTime() + 7 * 86400000),
        schedule: "10:00-13:00",
        totalPrice: 135,
        status: "confirmada",
        services: [{ type: "clase_grupo", quantity: 3 }],
      },
    });
  }

  console.log(
    `Seeded sierra-ski tenant: id=${tenant.id}, owner=sierra@test.com, products=${sierraProducts.length}`,
  );
}

async function main() {
  // ==================== DEMO TENANT ====================
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: { isDemo: true, dataMode: "mock" },
    create: {
      name: "Skicenter Demo",
      slug: "demo",
      onboardingComplete: true,
      isDemo: true,
      dataMode: "mock",
    },
  });

  const roles = {
    owner: await prisma.role.upsert({
      where: { name_tenantId: { name: "Owner / Manager", tenantId: demoTenant.id } },
      update: {},
      create: { name: "Owner / Manager", tenantId: demoTenant.id, isSystem: true, permissions: DEFAULT_ROLES["Owner / Manager"] },
    }),
    sales: await prisma.role.upsert({
      where: { name_tenantId: { name: "Sales Rep", tenantId: demoTenant.id } },
      update: {},
      create: { name: "Sales Rep", tenantId: demoTenant.id, isSystem: true, permissions: DEFAULT_ROLES["Sales Rep"] },
    }),
    marketing: await prisma.role.upsert({
      where: { name_tenantId: { name: "Marketing", tenantId: demoTenant.id } },
      update: {},
      create: { name: "Marketing", tenantId: demoTenant.id, isSystem: true, permissions: DEFAULT_ROLES["Marketing"] },
    }),
    va: await prisma.role.upsert({
      where: { name_tenantId: { name: "VA / Admin", tenantId: demoTenant.id } },
      update: {},
      create: { name: "VA / Admin", tenantId: demoTenant.id, isSystem: true, permissions: DEFAULT_ROLES["VA / Admin"] },
    }),
  };

  // 3 Demo users
  const pw = await hash("demo123", 12);
  await prisma.user.upsert({
    where: { email_tenantId: { email: "demo@skicenter.com", tenantId: demoTenant.id } },
    update: {},
    create: { email: "demo@skicenter.com", name: "Demo Admin", passwordHash: pw, tenantId: demoTenant.id, roleId: roles.owner.id },
  });
  await prisma.user.upsert({
    where: { email_tenantId: { email: "natalia@demo.skicenter.com", tenantId: demoTenant.id } },
    update: {},
    create: { email: "natalia@demo.skicenter.com", name: "Natalia García", passwordHash: pw, tenantId: demoTenant.id, roleId: roles.sales.id },
  });
  await prisma.user.upsert({
    where: { email_tenantId: { email: "manager@demo.skicenter.com", tenantId: demoTenant.id } },
    update: {},
    create: { email: "manager@demo.skicenter.com", name: "Carlos Martínez", passwordHash: pw, tenantId: demoTenant.id, roleId: roles.va.id },
  });

  // Dedicated instructor demo user
  await prisma.user.upsert({
    where: { email_tenantId: { email: "profesor@demo.skicenter.com", tenantId: demoTenant.id } },
    update: {},
    create: { email: "profesor@demo.skicenter.com", name: "Alejandro López", passwordHash: pw, tenantId: demoTenant.id, roleId: roles.sales.id },
  });

  // Keep old demo users for backward compat
  await prisma.user.upsert({
    where: { email_tenantId: { email: "admin@demo.com", tenantId: demoTenant.id } },
    update: {},
    create: { email: "admin@demo.com", name: "Demo Admin (legacy)", passwordHash: await hash("demo1234", 12), tenantId: demoTenant.id, roleId: roles.owner.id },
  });
  await prisma.user.upsert({
    where: { email_tenantId: { email: "sales@demo.com", tenantId: demoTenant.id } },
    update: {},
    create: { email: "sales@demo.com", name: "Demo Sales (legacy)", passwordHash: await hash("demo1234", 12), tenantId: demoTenant.id, roleId: roles.sales.id },
  });

  for (const mod of ["comms", "pipelines", "analytics", "contacts"]) {
    await prisma.moduleConfig.upsert({
      where: { tenantId_module: { tenantId: demoTenant.id, module: mod } },
      update: {},
      create: { tenantId: demoTenant.id, module: mod, isEnabled: true },
    });
  }

  // Seed products + season calendar + curated demo data
  const productCount = await seedProducts();
  console.log(`Seeded ${productCount} global products`);

  await seedCatalogEnrichment();

  const calendarCount = await seedSeasonCalendar(demoTenant.id);
  console.log(`Seeded ${calendarCount} season calendar entries for demo tenant`);

  await seedDemoData(demoTenant.id);

  await seedNewModules(demoTenant.id);

  await seedDemoContent(demoTenant.id);

  await seedCmsEnhancement(demoTenant.id);

  const extra = await seedExtraModules(prisma, demoTenant.id, { wipe: true });
  console.log(`Seeded extra modules: ${JSON.stringify(extra)}`);

  console.log("Demo tenant seed complete");

  // ==================== SECOND TENANT (multi-tenant isolation proof) ====================
  await seedSierraSkiTenant();
}

main().catch(console.error).finally(() => prisma.$disconnect());
