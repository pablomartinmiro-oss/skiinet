// Comprehensive seeder for "extra" demo modules.
// Called by prisma/seed.ts and by /api/admin/{reset-demo,seed-all-modules}.
// Accepts any PrismaClient instance so it works with both the runtime client and the seed adapter client.

import type { PrismaClient } from "@/generated/prisma/client";
import { hash } from "bcryptjs";
import {
  DEMO_LEADS,
  DEMO_EXTRA_INSTRUCTORS,
  DEMO_INTERNAL_MESSAGES,
  DEMO_NOTIFICATIONS,
  DEMO_EXTRA_ROOM_TYPE,
  DEMO_LODGE_STAYS,
  DEMO_INVOICES,
  DEMO_EXPENSES,
  DEMO_SUPPLIERS,
  DEMO_REVIEWS,
  DEMO_TPV_SESSION,
  DEMO_TPV_SALES,
} from "@/lib/constants/demo-seed-data";

type Db = PrismaClient;

interface SeedOpts {
  /** Wipe existing rows for these modules before re-seeding. */
  wipe: boolean;
}

const DEMO_PASSWORD = "demo123";

function dateOffset(daysOffset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d;
}

function dateHoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3600000);
}

export async function seedExtraModules(prisma: Db, tenantId: string, opts: SeedOpts) {
  const result = {
    leads: 0,
    extraInstructors: 0,
    internalMessages: 0,
    notifications: 0,
    lodgeStays: 0,
    invoices: 0,
    expenses: 0,
    suppliers: 0,
    settlements: 0,
    settlementLines: 0,
    reviews: 0,
    tpvSales: 0,
    extraAssignments: 0,
  };

  // ==================== LEADS ====================
  if (opts.wipe) {
    await prisma.lead.deleteMany({ where: { tenantId } });
  }
  for (const lead of DEMO_LEADS) {
    const exists = !opts.wipe && (await prisma.lead.findFirst({ where: { tenantId, email: lead.email } }));
    if (exists) continue;
    await prisma.lead.create({
      data: {
        tenantId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        pipelineStage: lead.pipelineStage,
        score: lead.score,
        tags: lead.tags,
        notes: lead.notes,
        lostReason: lead.lostReason ?? null,
        lastContactedAt: lead.status === "contactado" || lead.status === "calificado" ? dateOffset(-Math.max(1, lead.daysOld - 1)) : null,
        convertedAt: lead.status === "convertido" ? dateOffset(-Math.max(1, lead.daysOld - 5)) : null,
        createdAt: dateOffset(-lead.daysOld),
      },
    });
    result.leads++;
  }

  // ==================== EXTRA INSTRUCTORS (3 more) ====================
  const salesRole = await prisma.role.findFirst({ where: { tenantId, name: "Sales Rep" } });
  const newInstructorIds: string[] = [];
  if (salesRole) {
    const pw = await hash(DEMO_PASSWORD, 12);
    for (const inst of DEMO_EXTRA_INSTRUCTORS) {
      const user = await prisma.user.upsert({
        where: { email_tenantId: { email: inst.email, tenantId } },
        update: {},
        create: { email: inst.email, name: inst.name, passwordHash: pw, tenantId, roleId: salesRole.id },
      });
      const instructor = await prisma.instructor.upsert({
        where: { tenantId_userId: { tenantId, userId: user.id } },
        update: {
          tdLevel: inst.tdLevel,
          station: inst.station,
          disciplines: inst.disciplines,
          specialties: inst.specialties,
          languages: inst.languages,
          hourlyRate: inst.hourlyRate,
          perStudentBonus: inst.perStudentBonus,
          certNumber: inst.certNumber,
          contractType: inst.contractType,
          isActive: true,
        },
        create: {
          tenantId, userId: user.id,
          tdLevel: inst.tdLevel,
          station: inst.station,
          disciplines: inst.disciplines,
          specialties: inst.specialties,
          languages: inst.languages,
          hourlyRate: inst.hourlyRate,
          perStudentBonus: inst.perStudentBonus,
          certNumber: inst.certNumber,
          contractType: inst.contractType,
          isActive: true,
        },
      });
      newInstructorIds.push(instructor.id);
      // Availability Mon-Sat
      for (let day = 1; day <= 6; day++) {
        await prisma.instructorAvailability.upsert({
          where: { tenantId_instructorId_dayOfWeek: { tenantId, instructorId: instructor.id, dayOfWeek: day } },
          update: {},
          create: { tenantId, instructorId: instructor.id, dayOfWeek: day, startTime: "09:00", endTime: "17:00", isActive: true },
        });
      }
      // Time entries last 5 working days
      for (let dayOff = 0; dayOff < 5; dayOff++) {
        const d = dateOffset(-dayOff);
        if (d.getDay() === 0) continue;
        const existing = await prisma.instructorTimeEntry.findFirst({
          where: { tenantId, instructorId: instructor.id, date: d },
        });
        if (existing) continue;
        const clockIn = new Date(d);
        clockIn.setHours(8, 50, 0, 0);
        const clockOut = dayOff === 0 ? null : new Date(d);
        if (clockOut) clockOut.setHours(16, 45, 0, 0);
        const totalMin = clockOut ? Math.round((clockOut.getTime() - clockIn.getTime()) / 60000) : 0;
        const breakMin = clockOut ? 45 : 0;
        await prisma.instructorTimeEntry.create({
          data: {
            tenantId, instructorId: instructor.id, date: d, clockIn, clockOut,
            totalMinutes: totalMin, breakMinutes: breakMin, netMinutes: Math.max(0, totalMin - breakMin),
            source: "mobile",
            lockedAt: dayOff > 1 ? new Date() : null,
            lockedBy: dayOff > 1 ? "system" : null,
          },
        });
      }
      result.extraInstructors++;
    }
  }

  // Extra activity bookings + assignments using new instructors (target ~20 total)
  if (newInstructorIds.length > 0) {
    const existingAssignments = await prisma.instructorAssignment.count({ where: { tenantId } });
    if (existingAssignments < 20) {
      // Pick more confirmed reservations (skip those that already have a booking)
      const confirmed = await prisma.reservation.findMany({
        where: { tenantId, status: "confirmada" },
        orderBy: { activityDate: "asc" },
        take: 30,
      });
      const lessonTypes = ["group", "private", "group", "freeride"];
      const scheds = [
        { s: "10:00", e: "13:00" },
        { s: "13:00", e: "15:00" },
        { s: "09:30", e: "12:30" },
        { s: "15:00", e: "17:00" },
      ];
      let created = 0;
      const need = 20 - existingAssignments;
      for (const res of confirmed) {
        if (created >= need) break;
        const hasBooking = await prisma.activityBooking.findFirst({ where: { tenantId, reservationId: res.id } });
        if (hasBooking) continue;
        const today = dateOffset(0);
        const booking = await prisma.activityBooking.create({
          data: {
            tenantId, reservationId: res.id, activityDate: res.activityDate,
            status: res.activityDate < today ? "confirmed" : "scheduled",
            arrivedClient: res.activityDate < today,
          },
        });
        const idx = created % newInstructorIds.length;
        const sc = scheds[created % scheds.length];
        const lt = lessonTypes[created % lessonTypes.length];
        const studentCount = lt === "group" ? 4 : lt === "private" ? 1 : 2;
        const inst = DEMO_EXTRA_INSTRUCTORS[idx];
        await prisma.instructorAssignment.create({
          data: {
            tenantId, instructorId: newInstructorIds[idx], bookingId: booking.id,
            lessonType: lt, studentCount,
            scheduledStart: sc.s, scheduledEnd: sc.e,
            hourlyRate: inst.hourlyRate, bonusPerStudent: inst.perStudentBonus,
            surcharge: lt === "freeride" ? 12 : 0,
            surchargeReason: lt === "freeride" ? "Fuera de pista" : null,
            status: res.activityDate < today ? "completed" : "assigned",
            completedAt: res.activityDate < today ? res.activityDate : null,
          },
        });
        created++;
        result.extraAssignments++;
      }
    }
  }

  // ==================== INTERNAL MESSAGES ====================
  if (opts.wipe) {
    await prisma.message.deleteMany({ where: { tenantId } });
  }
  for (const m of DEMO_INTERNAL_MESSAGES) {
    const fromUser = await prisma.user.findFirst({ where: { tenantId, email: m.fromEmail } });
    const toUser = await prisma.user.findFirst({ where: { tenantId, email: m.toEmail } });
    if (!fromUser || !toUser) continue;
    if (!opts.wipe) {
      const exists = await prisma.message.findFirst({ where: { tenantId, fromUserId: fromUser.id, toUserId: toUser.id, body: m.body } });
      if (exists) continue;
    }
    await prisma.message.create({
      data: {
        tenantId, fromUserId: fromUser.id, toUserId: toUser.id,
        body: m.body, isRead: m.isRead,
        readAt: m.isRead ? dateHoursAgo(m.hoursAgo - 0.1) : null,
        createdAt: dateHoursAgo(m.hoursAgo),
      },
    });
    result.internalMessages++;
  }

  // ==================== NOTIFICATIONS ====================
  if (opts.wipe) {
    await prisma.notification.deleteMany({ where: { tenantId } });
  }
  for (const n of DEMO_NOTIFICATIONS) {
    const user = await prisma.user.findFirst({ where: { tenantId, email: n.toEmail } });
    if (!user) continue;
    if (!opts.wipe) {
      const exists = await prisma.notification.findFirst({ where: { tenantId, userId: user.id, title: n.title, type: n.type } });
      if (exists) continue;
    }
    await prisma.notification.create({
      data: {
        tenantId, userId: user.id, type: n.type,
        title: n.title, body: n.body, isRead: n.isRead,
        createdAt: dateHoursAgo(n.hoursAgo),
      },
    });
    result.notifications++;
  }

  // ==================== EXTRA ROOM TYPE + LODGE STAYS ====================
  const extraRoom = await prisma.roomType.upsert({
    where: { tenantId_slug: { tenantId, slug: DEMO_EXTRA_ROOM_TYPE.slug } },
    update: { title: DEMO_EXTRA_ROOM_TYPE.title, capacity: DEMO_EXTRA_ROOM_TYPE.capacity, basePrice: DEMO_EXTRA_ROOM_TYPE.basePrice, description: DEMO_EXTRA_ROOM_TYPE.description },
    create: {
      tenantId, slug: DEMO_EXTRA_ROOM_TYPE.slug, title: DEMO_EXTRA_ROOM_TYPE.title,
      capacity: DEMO_EXTRA_ROOM_TYPE.capacity, basePrice: DEMO_EXTRA_ROOM_TYPE.basePrice,
      description: DEMO_EXTRA_ROOM_TYPE.description, images: [],
    },
  });
  // Rates for new room type across existing seasons
  const existingSeasons = await prisma.roomRateSeason.findMany({ where: { tenantId }, take: 2 });
  const seasonMultipliers = [1.0, 1.5];
  for (let si = 0; si < existingSeasons.length; si++) {
    for (let dow = 0; dow < 7; dow++) {
      const base = DEMO_EXTRA_ROOM_TYPE.basePrice * seasonMultipliers[si];
      const weekendBump = dow === 5 || dow === 6 ? 15 : 0;
      await prisma.roomRate.upsert({
        where: { tenantId_roomTypeId_seasonId_dayOfWeek: { tenantId, roomTypeId: extraRoom.id, seasonId: existingSeasons[si].id, dayOfWeek: dow } },
        update: {},
        create: { tenantId, roomTypeId: extraRoom.id, seasonId: existingSeasons[si].id, dayOfWeek: dow, price: base + weekendBump },
      });
    }
  }

  if (opts.wipe) {
    await prisma.lodgeStay.deleteMany({ where: { tenantId } });
  }
  for (const stay of DEMO_LODGE_STAYS) {
    const room = await prisma.roomType.findFirst({ where: { tenantId, slug: stay.roomTypeSlug } });
    if (!opts.wipe) {
      const exists = await prisma.lodgeStay.findFirst({ where: { tenantId, guestEmail: stay.guestEmail } });
      if (exists) continue;
    }
    await prisma.lodgeStay.create({
      data: {
        tenantId, roomTypeId: room?.id ?? null,
        guestName: stay.guestName, guestEmail: stay.guestEmail, guestPhone: stay.guestPhone,
        checkIn: dateOffset(stay.checkInDaysOffset), checkOut: dateOffset(stay.checkOutDaysOffset),
        adults: stay.adults, children: stay.children,
        totalAmount: stay.totalAmount, status: stay.status, notes: stay.notes,
      },
    });
    result.lodgeStays++;
  }

  // ==================== INVOICES (12) ====================
  if (opts.wipe) {
    await prisma.invoiceLine.deleteMany({ where: { tenantId } });
    await prisma.transaction.deleteMany({ where: { tenantId } });
    await prisma.invoice.deleteMany({ where: { tenantId } });
  }
  for (const inv of DEMO_INVOICES) {
    if (!opts.wipe) {
      const exists = await prisma.invoice.findFirst({ where: { tenantId, number: inv.number } });
      if (exists) continue;
    }
    const created = await prisma.invoice.create({
      data: {
        tenantId, number: inv.number, status: inv.status,
        subtotal: inv.subtotal, taxAmount: inv.taxAmount, total: inv.total,
        issuedAt: inv.issuedDaysAgo != null ? dateOffset(-inv.issuedDaysAgo) : null,
        paidAt: inv.paidDaysAgo != null ? dateOffset(-inv.paidDaysAgo) : null,
        notes: inv.notes,
      },
    });
    for (const line of inv.lines) {
      await prisma.invoiceLine.create({
        data: { tenantId, invoiceId: created.id, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice, lineTotal: line.lineTotal, taxRate: 21 },
      });
    }
    if (inv.status === "paid") {
      const methods = ["card", "transfer", "bizum", "cash"];
      await prisma.transaction.create({
        data: {
          tenantId, invoiceId: created.id,
          date: inv.paidDaysAgo != null ? dateOffset(-inv.paidDaysAgo) : new Date(),
          amount: inv.total, method: methods[result.invoices % methods.length],
          status: "completed", reference: `TPV-${String(1000 + result.invoices)}`,
        },
      });
    }
    result.invoices++;
  }

  // ==================== EXPENSES (10) ====================
  if (opts.wipe) {
    await prisma.expense.deleteMany({ where: { tenantId } });
  }
  const expCats = await prisma.expenseCategory.findMany({ where: { tenantId } });
  const costCenters = await prisma.costCenter.findMany({ where: { tenantId } });
  const catByCode: Record<string, string> = {};
  for (const c of expCats) catByCode[c.code] = c.id;
  const ccByCode: Record<string, string> = {};
  for (const cc of costCenters) ccByCode[cc.code] = cc.id;

  for (const exp of DEMO_EXPENSES) {
    const categoryId = catByCode[exp.categoryCode];
    if (!categoryId) continue;
    if (!opts.wipe) {
      const exists = await prisma.expense.findFirst({ where: { tenantId, concept: exp.concept } });
      if (exists) continue;
    }
    await prisma.expense.create({
      data: {
        tenantId, categoryId,
        costCenterId: exp.costCenterCode ? ccByCode[exp.costCenterCode] ?? null : null,
        concept: exp.concept, amount: exp.amount,
        paymentMethod: exp.paymentMethod, status: exp.status,
        date: dateOffset(-exp.daysAgo),
      },
    });
    result.expenses++;
  }

  // ==================== SUPPLIERS + SETTLEMENTS ====================
  if (opts.wipe) {
    await prisma.settlementLine.deleteMany({ where: { tenantId } });
    await prisma.settlementStatusLog.deleteMany({ where: { tenantId } });
    await prisma.settlementDocument.deleteMany({ where: { tenantId } });
    await prisma.supplierSettlement.deleteMany({ where: { tenantId } });
    // Don't wipe Supplier table directly — Expenses may reference it. Just upsert.
  }
  for (const s of DEMO_SUPPLIERS) {
    const supplier = await prisma.supplier.upsert({
      where: { tenantId_nif: { tenantId, nif: s.nif } },
      update: {
        fiscalName: s.fiscalName, commercialName: s.commercialName, iban: s.iban,
        email: s.email, phone: s.phone, commissionPercentage: s.commissionPercentage,
        paymentMethod: s.paymentMethod, settlementFrequency: s.settlementFrequency, status: s.status,
      },
      create: {
        tenantId, fiscalName: s.fiscalName, commercialName: s.commercialName, nif: s.nif, iban: s.iban,
        email: s.email, phone: s.phone, commissionPercentage: s.commissionPercentage,
        paymentMethod: s.paymentMethod, settlementFrequency: s.settlementFrequency, status: s.status,
      },
    });
    result.suppliers++;

    // Skip settlement creation if it already exists (idempotency for additive mode)
    if (!opts.wipe) {
      const existing = await prisma.supplierSettlement.findFirst({ where: { tenantId, number: s.settlement.number } });
      if (existing) continue;
    }
    const grossAmount = s.settlement.lines.reduce((sum, l) => sum + l.saleAmount, 0);
    const commissionAmount = +(grossAmount * (s.commissionPercentage / 100)).toFixed(2);
    const netAmount = +(grossAmount - commissionAmount).toFixed(2);
    const settlement = await prisma.supplierSettlement.create({
      data: {
        tenantId, supplierId: supplier.id, number: s.settlement.number,
        startDate: dateOffset(-s.settlement.startDaysAgo),
        endDate: dateOffset(-s.settlement.endDaysAgo),
        status: s.settlement.status,
        grossAmount, commissionAmount, netAmount,
        sentAt: s.settlement.sentDaysAgo != null ? dateOffset(-s.settlement.sentDaysAgo) : null,
        paidAt: s.settlement.paidDaysAgo != null ? dateOffset(-s.settlement.paidDaysAgo) : null,
      },
    });
    result.settlements++;
    for (const line of s.settlement.lines) {
      const lineCommission = +(line.saleAmount * (s.commissionPercentage / 100)).toFixed(2);
      await prisma.settlementLine.create({
        data: {
          tenantId, settlementId: settlement.id,
          serviceType: line.serviceType,
          serviceDate: dateOffset(-line.serviceDate_daysAgo),
          paxCount: line.paxCount, saleAmount: line.saleAmount,
          commissionPercentage: s.commissionPercentage, commissionAmount: lineCommission,
        },
      });
      result.settlementLines++;
    }
  }

  // ==================== REVIEWS (10) ====================
  if (opts.wipe) {
    await prisma.review.deleteMany({ where: { tenantId } });
  }
  for (const r of DEMO_REVIEWS) {
    if (!opts.wipe) {
      const exists = await prisma.review.findFirst({ where: { tenantId, authorEmail: r.authorEmail, title: r.title } });
      if (exists) continue;
    }
    await prisma.review.create({
      data: {
        tenantId, entityType: r.entityType, entityId: r.entityId,
        rating: r.rating, authorName: r.authorName, authorEmail: r.authorEmail,
        title: r.title, body: r.body, status: r.status, reply: r.reply,
        stayDate: dateOffset(-r.stayDaysAgo),
      },
    });
    result.reviews++;
  }

  // ==================== TPV: register + open session + sales ====================
  const register = await prisma.cashRegister.findFirst({ where: { tenantId, name: DEMO_TPV_SESSION.registerName } })
    ?? await prisma.cashRegister.create({
      data: { tenantId, name: DEMO_TPV_SESSION.registerName, location: DEMO_TPV_SESSION.registerLocation, active: true },
    });

  const opener = await prisma.user.findFirst({ where: { tenantId, email: DEMO_TPV_SESSION.openedByEmail } });
  if (opener) {
    if (opts.wipe) {
      // Delete sales/items/movements first then sessions
      const oldSessions = await prisma.cashSession.findMany({ where: { tenantId, registerId: register.id } });
      for (const oldSess of oldSessions) {
        await prisma.tpvSaleItem.deleteMany({ where: { sale: { sessionId: oldSess.id } } });
        await prisma.tpvSale.deleteMany({ where: { sessionId: oldSess.id } });
        await prisma.cashMovement.deleteMany({ where: { sessionId: oldSess.id } });
      }
      await prisma.cashSession.deleteMany({ where: { tenantId, registerId: register.id } });
    }
    let session = await prisma.cashSession.findFirst({ where: { tenantId, registerId: register.id, status: "open" } });
    if (!session) {
      session = await prisma.cashSession.create({
        data: {
          tenantId, registerId: register.id, openedById: opener.id,
          openingAmount: DEMO_TPV_SESSION.openingAmount, status: "open",
          openedAt: dateHoursAgo(DEMO_TPV_SESSION.openedHoursAgo),
        },
      });
    }
    for (const sale of DEMO_TPV_SALES) {
      if (!opts.wipe) {
        const exists = await prisma.tpvSale.findFirst({ where: { tenantId, ticketNumber: sale.ticketNumber } });
        if (exists) continue;
      }
      const saleDate = dateHoursAgo(DEMO_TPV_SESSION.openedHoursAgo + sale.hoursAgoFromOpen);
      const created = await prisma.tpvSale.create({
        data: {
          tenantId, sessionId: session.id, ticketNumber: sale.ticketNumber,
          date: saleDate, totalAmount: sale.totalAmount, totalTax: sale.totalTax,
          paymentMethods: { cash: sale.cash, card: sale.card, bizum: sale.bizum },
        },
      });
      for (const item of sale.items) {
        await prisma.tpvSaleItem.create({
          data: {
            tenantId, saleId: created.id,
            description: item.description, quantity: item.quantity,
            unitPrice: item.unitPrice, lineTotal: item.lineTotal, taxPerLine: item.taxPerLine,
          },
        });
      }
      result.tpvSales++;
    }
  }

  // Enable extra modules
  const modules = ["leads", "tpv", "instructors", "hotel", "suppliers"];
  for (const mod of modules) {
    await prisma.moduleConfig.upsert({
      where: { tenantId_module: { tenantId, module: mod } },
      update: { isEnabled: true },
      create: { tenantId, module: mod, isEnabled: true },
    });
  }

  return result;
}
