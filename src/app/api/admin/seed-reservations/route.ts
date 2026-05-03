export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { generateDocumentNumber } from "@/lib/documents/numbering";

export async function POST() {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;

  try {
    // Check if already seeded
    const existingReservations = await prisma.reservation.count({ where: { tenantId } });
    if (existingReservations > 0) {
      return NextResponse.json({ message: `Already have ${existingReservations} reservations, skipping` });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const MOCK_RESERVATIONS = [
      { clientName: "Elena Rodríguez", clientPhone: "+34 611 223 344", clientEmail: "elena.r@email.com", couponCode: "GRP-8834", source: "groupon", station: "baqueira", activityDate: today, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", notes: "Principiante absoluta", emailSentAt: new Date(), whatsappSentAt: new Date(), notificationType: "confirmacion" },
      { clientName: "Roberto Jiménez", clientPhone: "+34 622 334 455", clientEmail: "roberto.j@email.com", couponCode: "GRP-9921", source: "groupon", station: "baqueira", activityDate: today, schedule: "10:00-13:00", totalPrice: 183, status: "confirmada", paymentMethod: "groupon", emailSentAt: new Date(), whatsappSentAt: new Date(), notificationType: "confirmacion" },
      { clientName: "Lucía Moreno", clientPhone: "+34 633 445 566", clientEmail: "lucia.m@email.com", couponCode: "GRP-1042", source: "groupon", station: "sierra_nevada", activityDate: today, schedule: "10:00-14:00", totalPrice: 183, status: "sin_disponibilidad", paymentMethod: "groupon", emailSentAt: new Date(), notificationType: "sin_disponibilidad" },
      { clientName: "Fernando Vega", clientPhone: "+34 644 556 677", clientEmail: "fernando.v@email.com", couponCode: "GRP-5567", source: "groupon", station: "baqueira", activityDate: tomorrow, schedule: "10:00-13:00", totalPrice: 275, status: "pendiente", paymentMethod: "groupon" },
      { clientName: "Isabel López", clientPhone: "+34 655 667 788", clientEmail: "isabel.l@email.com", source: "caja", station: "baqueira", activityDate: today, schedule: "15:00-18:00", totalPrice: 350, status: "confirmada", paymentMethod: "tarjeta", emailSentAt: new Date(), whatsappSentAt: new Date(), notificationType: "confirmacion", participants: [{ name: "Isabel López", type: "adulto", service: "Cursillo 3d", level: "Intermedio", material: true }, { name: "Miguel López", type: "adulto", service: "Cursillo 3d", level: "Principiante", material: true }] },
      { clientName: "Diego Navarro", clientPhone: "+34 666 778 899", clientEmail: "diego.n@email.com", source: "caja", station: "sierra_nevada", activityDate: today, schedule: "10:00-14:00", totalPrice: 120, status: "confirmada", paymentMethod: "efectivo", emailSentAt: new Date(), notificationType: "confirmacion" },
      { clientName: "Carmen Ruiz", clientPhone: "+34 677 889 900", clientEmail: "carmen.r@email.com", source: "caja", station: "formigal", activityDate: today, schedule: "10:00-13:00", totalPrice: 95, status: "confirmada", paymentMethod: "tarjeta", emailSentAt: new Date(), whatsappSentAt: new Date(), notificationType: "confirmacion" },
      { clientName: "María García López", clientPhone: "+34 612 345 678", clientEmail: "maria.garcia@email.com", source: "presupuesto", station: "baqueira", activityDate: new Date(today.getTime() + 4 * 86400000), schedule: "10:00-14:00", totalPrice: 1835, status: "confirmada", paymentMethod: "transferencia", emailSentAt: new Date(), whatsappSentAt: new Date(), notificationType: "confirmacion", participants: [{ name: "María García", type: "adulto", service: "Cursillo 3d", level: "Principiante", material: true }, { name: "José García", type: "adulto", service: "Cursillo 3d", level: "Principiante", material: true }, { name: "Sofía García", type: "infantil", service: "Cursillo 3d", level: "Principiante", material: true }, { name: "Pablo García", type: "infantil", service: "Escuelita", level: "Principiante", material: false }] },
      { clientName: "Carlos Fernández", clientPhone: "+34 678 901 234", clientEmail: "carlos.f@email.com", source: "presupuesto", station: "sierra_nevada", activityDate: new Date(today.getTime() + 16 * 86400000), schedule: "10:00-13:00", totalPrice: 960, status: "pendiente", paymentMethod: "transferencia" },
      { clientName: "Patricia Herrera", clientPhone: "+34 688 990 011", clientEmail: "patricia.h@email.com", source: "caja", station: "baqueira", activityDate: tomorrow, schedule: "10:00-13:00", totalPrice: 275, status: "pendiente" },
      { clientName: "Álvaro Muñoz", clientPhone: "+34 699 001 122", clientEmail: "alvaro.m@email.com", couponCode: "GRP-3312", source: "groupon", station: "sierra_nevada", activityDate: tomorrow, schedule: "15:00-18:00", totalPrice: 183, status: "pendiente", paymentMethod: "groupon" },
      { clientName: "Marta Serrano", clientPhone: "+34 600 112 233", clientEmail: "marta.s@email.com", source: "web", station: "grandvalira", activityDate: tomorrow, schedule: "10:00-14:00", totalPrice: 440, status: "pendiente", participants: [{ name: "Marta Serrano", type: "adulto", service: "Cursillo 5d", level: "Avanzado", material: false }, { name: "Iván Serrano", type: "adulto", service: "Forfait", level: "Avanzado", material: false }] },
    ];

    for (const reservation of MOCK_RESERVATIONS) {
      const number = await generateDocumentNumber(tenantId, "reservation", {
        context: "demo_seed",
      });
      await prisma.reservation.create({
        data: { tenantId, number, ...reservation },
      });
    }

    // Seed station capacity
    const existingCapacity = await prisma.stationCapacity.count({ where: { tenantId } });
    if (existingCapacity === 0) {
      const stations = ["baqueira", "sierra_nevada", "grandvalira", "formigal", "alto_campoo", "la_pinilla"];
      const serviceTypes = [
        { type: "cursillo_adulto", max: 50 },
        { type: "cursillo_infantil", max: 30 },
        { type: "clase_particular", max: 10 },
      ];

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);

        for (const station of stations) {
          for (const svc of serviceTypes) {
            const booked = dayOffset === 0
              ? Math.floor(Math.random() * svc.max * 0.8)
              : Math.floor(Math.random() * svc.max * 0.3);
            await prisma.stationCapacity.create({
              data: { tenantId, station, date, serviceType: svc.type, maxCapacity: svc.max, booked },
            });
          }
        }
      }
    }

    return NextResponse.json({
      message: `Seeded ${MOCK_RESERVATIONS.length} reservations + station capacity for 7 days`,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to seed reservations",
      code: "ADMIN_ERROR",
      logContext: { tenantId },
    });
  }
}
