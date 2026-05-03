export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { buildFullCatalog, SEASON_CALENDAR } from "@/lib/constants/product-catalog";
import {
  DEMO_CONTACTS,
  DEMO_RESERVATIONS,
  DEMO_QUOTES,
  DEMO_DEALS,
  DEMO_CONVERSATIONS,
  DEMO_CAPACITY,
} from "@/lib/constants/demo-seed-data";
import { seedExtraModules } from "@/lib/seed/seed-extra-modules";
import { generateDocumentNumber } from "@/lib/documents/numbering";
import { hash } from "bcryptjs";

const log = logger.child({ route: "reset-demo" });

/**
 * POST /api/admin/reset-demo
 * Deletes ALL data for the demo tenant and re-seeds everything fresh.
 * Only callable by demo tenant users.
 */
export async function POST() {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;

  // Verify this is the demo tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { isDemo: true },
  });

  if (!tenant?.isDemo) {
    return NextResponse.json(
      { error: "Solo disponible para la cuenta demo" },
      { status: 403 },
    );
  }

  try {
    // 1. Delete all data
    await Promise.all([
      prisma.reservation.deleteMany({ where: { tenantId } }),
      prisma.quote.deleteMany({ where: { tenantId } }),
      prisma.cachedContact.deleteMany({ where: { tenantId } }),
      prisma.cachedConversation.deleteMany({ where: { tenantId } }),
      prisma.cachedOpportunity.deleteMany({ where: { tenantId } }),
      prisma.cachedPipeline.deleteMany({ where: { tenantId } }),
      prisma.stationCapacity.deleteMany({ where: { tenantId } }),
      prisma.product.deleteMany({ where: { tenantId } }),
      prisma.seasonCalendar.deleteMany({ where: { tenantId } }),
      prisma.notification.deleteMany({ where: { tenantId } }),
    ]);

    // 2. Re-seed products
    const catalog = buildFullCatalog();
    for (const p of catalog) {
      await prisma.product.create({
        data: {
          tenantId,
          category: p.category,
          name: p.name,
          station: p.station,
          description: p.description ?? null,
          personType: p.personType ?? null,
          tier: p.tier ?? null,
          includesHelmet: p.includesHelmet ?? false,
          priceType: p.priceType,
          price: p.price,
          pricingMatrix: JSON.parse(JSON.stringify(p.pricingMatrix)),
          sortOrder: p.sortOrder,
          isActive: true,
        },
      });
    }

    // 3. Re-seed season calendar
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

    // 4. Re-seed demo data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Contacts
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
          dnd: false,
          raw: {},
          cachedAt: new Date(),
        },
      });
    }

    // Reservations
    for (const r of DEMO_RESERVATIONS) {
      const c = DEMO_CONTACTS[r.contactIndex];
      const activityDate = new Date(today);
      activityDate.setDate(activityDate.getDate() + r.daysOffset);
      const resNumber = await generateDocumentNumber(tenantId, "reservation", {
        context: "demo_seed",
      });
      await prisma.reservation.create({
        data: {
          tenantId,
          number: resNumber,
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
          voucherCouponCode: r.couponCode ?? null,
          voucherRedeemed: r.source === "groupon" && r.status === "confirmada",
          voucherPricePaid: r.source === "groupon" ? r.totalPrice : null,
        },
      });
    }

    // Quotes
    for (const q of DEMO_QUOTES) {
      const c = DEMO_CONTACTS[q.contactIndex];
      const checkIn = new Date(today);
      checkIn.setDate(checkIn.getDate() + q.checkIn);
      const checkOut = new Date(today);
      checkOut.setDate(checkOut.getDate() + q.checkOut);
      const quoteNumber = await generateDocumentNumber(tenantId, "quote", {
        context: "demo_seed",
      });
      await prisma.quote.create({
        data: {
          tenantId,
          number: quoteNumber,
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
          expiresAt: new Date(today.getTime() + 14 * 86400000),
        },
      });
    }

    // Pipeline + Deals
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

    // Conversations
    for (let i = 0; i < DEMO_CONVERSATIONS.length; i++) {
      const conv = DEMO_CONVERSATIONS[i];
      const c = DEMO_CONTACTS[conv.contactIndex];
      const lastMsg = conv.messages[conv.messages.length - 1];
      await prisma.cachedConversation.create({
        data: {
          id: `demo-conv-${String(i).padStart(3, "0")}`,
          tenantId,
          contactId: contactIds[conv.contactIndex],
          contactName: `${c.firstName} ${c.lastName}`,
          contactPhone: c.phone,
          contactEmail: c.email,
          lastMessageBody: lastMsg.body,
          lastMessageDate: new Date(Date.now() - lastMsg.minutesAgo * 60000),
          lastMessageType: conv.type,
          unreadCount: lastMsg.direction === "inbound" ? 1 : 0,
          raw: JSON.parse(JSON.stringify({ messages: conv.messages })),
          cachedAt: new Date(),
        },
      });
    }

    // Capacity
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      for (const cap of DEMO_CAPACITY) {
        const factor = d === 0 ? 1 : 0.3 + Math.random() * 0.3;
        await prisma.stationCapacity.create({
          data: { tenantId, station: cap.station, date, serviceType: "cursillo_adulto", maxCapacity: cap.cursillo_max, booked: d === 0 ? cap.cursillo_booked : Math.floor(cap.cursillo_max * factor) },
        });
        await prisma.stationCapacity.create({
          data: { tenantId, station: cap.station, date, serviceType: "clase_particular", maxCapacity: cap.clase_max, booked: d === 0 ? cap.clase_booked : Math.floor(cap.clase_max * factor) },
        });
      }
    }

    // Instructors: ensure profesor@ user exists + seed instructor data
    await prisma.instructorAssignment.deleteMany({ where: { tenantId } });
    await prisma.instructorTimeEntry.deleteMany({ where: { tenantId } });
    await prisma.instructorAvailability.deleteMany({ where: { tenantId } });
    await prisma.instructor.deleteMany({ where: { tenantId } });
    await prisma.activityBooking.deleteMany({ where: { tenantId } });

    const pw = await hash("demo123", 12);
    const salesRole = await prisma.role.findFirst({ where: { tenantId, name: "Sales Rep" } });
    if (salesRole) {
      await prisma.user.upsert({
        where: { email_tenantId: { email: "profesor@demo.skicenter.com", tenantId } },
        update: {},
        create: { email: "profesor@demo.skicenter.com", name: "Alejandro López", passwordHash: pw, tenantId, roleId: salesRole.id },
      });
    }

    const profUser = await prisma.user.findFirst({ where: { tenantId, email: "profesor@demo.skicenter.com" } });
    const natUser = await prisma.user.findFirst({ where: { tenantId, email: "natalia@demo.skicenter.com" } });
    const carUser = await prisma.user.findFirst({ where: { tenantId, email: "manager@demo.skicenter.com" } });
    const instrUsers = [profUser, natUser, carUser].filter(Boolean);

    if (instrUsers.length >= 3) {
      const instrData = [
        { userId: instrUsers[0]!.id, tdLevel: "TD3", station: "baqueira", disciplines: ["esqui", "snow"], languages: ["es", "en", "fr"], hourlyRate: 28, perStudentBonus: 3, certNumber: "TD3-2024-0412", contractType: "fijo_discontinuo" },
        { userId: instrUsers[1]!.id, tdLevel: "TD2", station: "baqueira", disciplines: ["esqui"], languages: ["es", "en"], hourlyRate: 22, perStudentBonus: 2.5, certNumber: "TD2-2023-1087", contractType: "fijo_discontinuo" },
        { userId: instrUsers[2]!.id, tdLevel: "TD1", station: "baqueira", disciplines: ["snow", "freestyle"], languages: ["es", "de"], hourlyRate: 18, perStudentBonus: 2, certNumber: "TD1-2025-0203", contractType: "temporal" },
      ];
      const instrIds: string[] = [];
      for (const d of instrData) {
        const inst = await prisma.instructor.create({ data: { tenantId, ...d, specialties: [], isActive: true } });
        instrIds.push(inst.id);
        for (let day = 1; day <= 6; day++) {
          await prisma.instructorAvailability.create({ data: { tenantId, instructorId: inst.id, dayOfWeek: day, startTime: "09:00", endTime: "17:00", isActive: true } });
        }
      }

      // Time entries (7 days)
      for (let dayOff = 0; dayOff < 7; dayOff++) {
        const d = new Date(today);
        d.setDate(d.getDate() - dayOff);
        if (d.getDay() === 0) continue;
        for (const instId of instrIds) {
          const clockIn = new Date(d);
          clockIn.setHours(8, 45 + Math.floor(Math.random() * 15), 0, 0);
          const clockOut = dayOff === 0 ? null : new Date(d);
          if (clockOut) clockOut.setHours(16, 30 + Math.floor(Math.random() * 30), 0, 0);
          const totalMin = clockOut ? Math.round((clockOut.getTime() - clockIn.getTime()) / 60000) : 0;
          const breakMin = clockOut ? 45 : 0;
          await prisma.instructorTimeEntry.create({
            data: { tenantId, instructorId: instId, date: d, clockIn, clockOut, totalMinutes: totalMin, breakMinutes: breakMin, netMinutes: Math.max(0, totalMin - breakMin), source: "mobile", lockedAt: dayOff > 1 ? new Date() : null, lockedBy: dayOff > 1 ? "system" : null },
          });
        }
      }

      // Activity bookings + assignments from confirmed reservations
      const confirmed = await prisma.reservation.findMany({ where: { tenantId, status: "confirmada" }, take: 15, orderBy: { activityDate: "asc" } });
      const lessonTypes = ["group", "private", "group", "group", "adaptive"];
      const scheds = [{ s: "09:15", e: "12:00" }, { s: "10:00", e: "12:00" }, { s: "13:00", e: "16:00" }, { s: "09:15", e: "12:15" }, { s: "13:00", e: "15:00" }];
      for (let i = 0; i < confirmed.length; i++) {
        const res = confirmed[i];
        const bk = await prisma.activityBooking.create({ data: { tenantId, reservationId: res.id, activityDate: res.activityDate, status: res.activityDate < today ? "confirmed" : "scheduled", arrivedClient: res.activityDate < today } });
        const idx = i % instrIds.length;
        const sc = scheds[i % scheds.length];
        const lt = lessonTypes[i % lessonTypes.length];
        const sc2 = lt === "group" ? 3 + Math.floor(Math.random() * 5) : lt === "private" ? 1 : 2;
        await prisma.instructorAssignment.create({
          data: { tenantId, instructorId: instrIds[idx], bookingId: bk.id, lessonType: lt, studentCount: sc2, scheduledStart: sc.s, scheduledEnd: sc.e, hourlyRate: instrData[idx].hourlyRate, bonusPerStudent: instrData[idx].perStudentBonus, surcharge: lt === "adaptive" ? 8 : 0, surchargeReason: lt === "adaptive" ? "Clase adaptativa" : null, status: res.activityDate < today ? "completed" : "assigned", completedAt: res.activityDate < today ? res.activityDate : null },
        });
      }
    }

    // Update school products with planning fields
    await prisma.product.updateMany({
      where: { category: "escuela" },
      data: { discipline: "esqui", requiresGrouping: true, planningMode: "dynamic_grouping", maxParticipants: 10, minAge: 6, maxAge: 99 },
    });
    await prisma.product.updateMany({
      where: { category: "clase_particular" },
      data: { discipline: "esqui", requiresGrouping: false, planningMode: "fixed_slot", maxParticipants: 6, minAge: 3, maxAge: 99 },
    });

    // Create structured participants + GroupCells for confirmed reservations
    await prisma.classCheckIn.deleteMany({ where: { tenantId } });
    await prisma.operationalUnit.deleteMany({ where: { tenantId } });
    await prisma.groupCell.deleteMany({ where: { tenantId } });
    await prisma.participant.deleteMany({ where: { tenantId } });
    await prisma.incident.deleteMany({ where: { tenantId } });

    const demoParticipants = [
      { firstName: "Lucas", level: "A", ageBracket: "infantil", discipline: "esqui", language: "es", age: 8 },
      { firstName: "Sofia", level: "A", ageBracket: "infantil", discipline: "esqui", language: "es", age: 9 },
      { firstName: "Pablo", level: "B", ageBracket: "adolescente", discipline: "esqui", language: "es", age: 14 },
      { firstName: "Emma", level: "B", ageBracket: "adulto", discipline: "snow", language: "en", age: 28 },
      { firstName: "Hans", level: "C", ageBracket: "adulto", discipline: "esqui", language: "de", age: 35 },
      { firstName: "Marie", level: "A", ageBracket: "adulto", discipline: "esqui", language: "fr", age: 42 },
      { firstName: "Liam", level: "A", ageBracket: "infantil", discipline: "esqui", language: "en", age: 7 },
      { firstName: "Martina", level: "B", ageBracket: "adolescente", discipline: "snow", language: "es", age: 15 },
    ];

    const confirmedForPlanning = await prisma.reservation.findMany({
      where: { tenantId, status: "confirmada" },
      take: 8,
      orderBy: { activityDate: "asc" },
    });

    const participantIds: string[] = [];
    for (let i = 0; i < Math.min(demoParticipants.length, confirmedForPlanning.length); i++) {
      const dp = demoParticipants[i];
      const res = confirmedForPlanning[i];
      const p = await prisma.participant.create({
        data: { tenantId, reservationId: res.id, ...dp },
      });
      participantIds.push(p.id);

      // Create OU
      await prisma.operationalUnit.create({
        data: {
          tenantId, participantId: p.id, reservationId: res.id,
          activityDate: res.activityDate,
          planningMode: dp.discipline === "snow" ? "dynamic_grouping" : "dynamic_grouping",
          status: "grouped",
        },
      });
    }

    // Create GroupCells with participants (instrIds available from instructor block above)
    const allInstructors = await prisma.instructor.findMany({ where: { tenantId }, take: 3 });
    const instrIds = allInstructors.map((i) => i.id);
    if (instrIds.length >= 3) {
      const gc1 = await prisma.groupCell.create({
        data: {
          tenantId, activityDate: today, station: "baqueira",
          timeSlotStart: "10:00", timeSlotEnd: "13:00",
          discipline: "esqui", level: "A", ageBracket: "infantil", language: "es",
          instructorId: instrIds[0], status: "confirmed",
        },
      });
      const gc2 = await prisma.groupCell.create({
        data: {
          tenantId, activityDate: today, station: "baqueira",
          timeSlotStart: "10:00", timeSlotEnd: "13:00",
          discipline: "esqui", level: "B", ageBracket: "adulto", language: "es",
          instructorId: instrIds[1], status: "confirmed",
        },
      });
      const gc3 = await prisma.groupCell.create({
        data: {
          tenantId, activityDate: today, station: "baqueira",
          timeSlotStart: "13:00", timeSlotEnd: "16:00",
          discipline: "snow", level: "A", ageBracket: "adulto", language: "en",
          instructorId: instrIds[2], status: "confirmed",
        },
      });

      // Link OUs to GroupCells
      const ous = await prisma.operationalUnit.findMany({ where: { tenantId }, take: 8 });
      for (const ou of ous) {
        const p = await prisma.participant.findFirst({ where: { id: ou.participantId } });
        if (!p) continue;
        const targetGc = p.level === "A" && p.discipline === "esqui" ? gc1.id
          : p.level === "B" ? gc2.id
          : gc3.id;
        await prisma.operationalUnit.update({
          where: { id: ou.id },
          data: { groupCellId: targetGc, status: "grouped" },
        });
      }
    }

    // Enable instructors module
    await prisma.moduleConfig.upsert({
      where: { tenantId_module: { tenantId, module: "instructors" } },
      update: { isEnabled: true },
      create: { tenantId, module: "instructors", isEnabled: true },
    });

    // Seed extra modules (leads, internal messages, notifications, lodge stays,
    // 12 invoices, 10 expenses, 3 suppliers + settlements, 10 reviews, TPV session + sales,
    // extra room type + 3 more instructors with assignments).
    const extra = await seedExtraModules(prisma, tenantId, { wipe: true });

    log.info({ extra }, "Demo reset complete (with full planning data + extra modules)");

    return NextResponse.json({
      success: true,
      seeded: {
        contacts: DEMO_CONTACTS.length,
        reservations: DEMO_RESERVATIONS.length,
        quotes: DEMO_QUOTES.length,
        deals: DEMO_DEALS.length,
        conversations: DEMO_CONVERSATIONS.length,
        products: catalog.length,
        instructors: instrUsers.length + extra.extraInstructors,
        ...extra,
      },
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to reset demo data",
      code: "ADMIN_ERROR",
      logContext: { tenantId },
    });
  }
}
