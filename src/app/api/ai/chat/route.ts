export const dynamic = "force-dynamic";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, tool } from "ai";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { computeAgeBracket } from "@/lib/planning/types";
import { generateDocumentNumber } from "@/lib/documents/numbering";

export const maxDuration = 30;

const SYSTEM_PROMPT = `Eres Atlas, el asistente AI de Skicenter — un ERP para escuelas de esqui.

CAPACIDADES:
- Crear productos en el catalogo (cursillos, clases particulares, forfaits, etc)
- Crear reservas con participantes estructurados (nombre, edad, nivel, disciplina)
- Buscar reservas por nombre, fecha o estado
- Asignar clases a profesores en el horario
- Auto-agrupar participantes pendientes de un dia
- Auto-asignar profesores a grupos sin asignar
- Consultar el planning del dia (grupos, profesores, participantes)
- Consultar profesores disponibles
- Fichar entrada/salida de profesores
- Emitir diplomas de nivel
- Consultar KPIs del dia (ocupacion, grupos, incidencias)

REGLAS:
- Siempre responde en ESPANOL
- Se breve y directo (2-3 frases max)
- Cuando crees algo, confirma que se creo con los datos
- Si falta informacion, pregunta lo necesario
- Usa las herramientas disponibles, no inventes datos
- Niveles de esqui: A (principiante), B (basico), C (intermedio), D (avanzado)
- Disciplinas: esqui, snow, telemark, freestyle
- Horarios cursillos: manana 10:00-13:00, tarde 13:00-16:00
- Clases particulares: flexible 9:00-16:00

ESTACIONES: Baqueira Beret, Sierra Nevada, La Pinilla, Formigal, Grandvalira
`;

export async function POST(req: Request) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;

  try {
    const { messages } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ text: "ANTHROPIC_API_KEY no configurada." }, { status: 503 });
    }

    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: SYSTEM_PROMPT,
      messages,
      maxTokens: 1000,
      tools: {
        createReservationWithParticipants: tool({
          description: "Crea una reserva con participantes estructurados para el planning de la escuela de esqui",
          parameters: z.object({
            clientName: z.string().describe("Nombre del titular de la reserva"),
            clientPhone: z.string().default("").describe("Telefono del titular"),
            clientEmail: z.string().default("").describe("Email del titular"),
            station: z.string().default("baqueira").describe("Estacion de esqui"),
            activityDate: z.string().describe("Fecha de la actividad (YYYY-MM-DD)"),
            schedule: z.string().default("10:00-13:00").describe("Horario"),
            source: z.string().default("web").describe("Origen de la reserva"),
            participants: z.array(z.object({
              firstName: z.string(),
              age: z.number().optional(),
              discipline: z.enum(["esqui", "snow", "telemark", "freestyle"]).default("esqui"),
              level: z.enum(["A", "B", "C", "D"]).default("A"),
              language: z.string().default("es"),
            })).describe("Lista de participantes"),
          }),
          execute: async ({ clientName, clientPhone, clientEmail, station, activityDate, schedule, source, participants }) => {
            const number = await generateDocumentNumber(tenantId, "reservation", {
              context: "ai_chat",
            });
            const reservation = await prisma.reservation.create({
              data: {
                tenantId, number, clientName, clientPhone: clientPhone || "000000000",
                clientEmail: clientEmail || "", station, activityDate: new Date(activityDate),
                schedule, source, status: "confirmada", totalPrice: 0,
              },
            });
            const created = [];
            for (const p of participants) {
              const ageBracket = p.age ? computeAgeBracket(p.age) : "adulto";
              const participant = await prisma.participant.create({
                data: {
                  tenantId, reservationId: reservation.id,
                  firstName: p.firstName, age: p.age ?? null,
                  ageBracket, discipline: p.discipline, level: p.level,
                  language: p.language,
                },
              });
              created.push({ id: participant.id, name: p.firstName, level: p.level });
            }
            return { reservationId: reservation.id, clientName, station, date: activityDate, participants: created };
          },
        }),

        assignClassToInstructor: tool({
          description: "Crea un grupo (GroupCell) y asigna un profesor a una clase en un horario",
          parameters: z.object({
            instructorName: z.string().describe("Nombre del profesor"),
            date: z.string().describe("Fecha (YYYY-MM-DD)"),
            startTime: z.string().default("10:00").describe("Hora inicio (HH:mm)"),
            endTime: z.string().default("13:00").describe("Hora fin (HH:mm)"),
            discipline: z.enum(["esqui", "snow", "telemark", "freestyle"]).default("esqui"),
            level: z.enum(["A", "B", "C", "D"]).default("A"),
            station: z.string().default("baqueira"),
          }),
          execute: async ({ instructorName, date, startTime, endTime, discipline, level, station }) => {
            const instructor = await prisma.instructor.findFirst({
              where: { tenantId, user: { name: { contains: instructorName, mode: "insensitive" as const } } },
              include: { user: { select: { name: true } } },
            });
            if (!instructor) return { error: `Profesor "${instructorName}" no encontrado` };

            const group = await prisma.groupCell.create({
              data: {
                tenantId, activityDate: new Date(date), station,
                timeSlotStart: startTime, timeSlotEnd: endTime,
                discipline, level, instructorId: instructor.id, status: "confirmed",
              },
            });
            return { groupId: group.id, instructor: instructor.user.name, date, time: `${startTime}-${endTime}`, discipline, level };
          },
        }),

        getInstructors: tool({
          description: "Consulta los profesores disponibles con su informacion",
          parameters: z.object({
            station: z.string().optional().describe("Filtrar por estacion"),
          }),
          execute: async ({ station }) => {
            const where: Record<string, unknown> = { tenantId, isActive: true };
            if (station) where.station = station;
            const instructors = await prisma.instructor.findMany({
              where,
              include: { user: { select: { name: true } } },
              take: 20,
            });
            return instructors.map((i) => ({
              name: i.user.name, tdLevel: i.tdLevel, station: i.station,
              disciplines: i.disciplines, languages: i.languages,
              hourlyRate: i.hourlyRate,
            }));
          },
        }),

        getTodayPlanning: tool({
          description: "Consulta el planning del dia: grupos formados, profesores asignados, participantes",
          parameters: z.object({
            date: z.string().optional().describe("Fecha (YYYY-MM-DD), por defecto hoy"),
            station: z.string().optional(),
          }),
          execute: async ({ date, station }) => {
            const d = date ? new Date(date) : new Date();
            const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
            const where: Record<string, unknown> = { tenantId, activityDate: { gte: dayStart, lte: dayEnd } };
            if (station) where.station = station;
            const groups = await prisma.groupCell.findMany({
              where,
              include: {
                instructor: { select: { user: { select: { name: true } }, tdLevel: true } },
                units: { include: { participant: { select: { firstName: true, level: true, discipline: true } } } },
              },
            });
            return groups.map((g) => ({
              time: `${g.timeSlotStart}-${g.timeSlotEnd}`,
              discipline: g.discipline, level: g.level,
              instructor: g.instructor?.user.name ?? "Sin asignar",
              participants: g.units.map((u) => u.participant.firstName),
              count: g.units.length,
            }));
          },
        }),

        createProduct: tool({
          description: "Crea un producto en el catalogo (clase, cursillo, forfait, alquiler, etc)",
          parameters: z.object({
            name: z.string().describe("Nombre del producto"),
            category: z.enum(["escuela", "clase_particular", "forfait", "alquiler", "locker", "menu", "snowcamp", "apreski", "taxi", "pack"]),
            station: z.string().default("baqueira"),
            price: z.number().describe("Precio base en EUR"),
            priceType: z.enum(["per_day", "per_person_per_hour", "per_session", "fixed"]).default("per_day"),
            discipline: z.string().optional().describe("esqui, snow, telemark, freestyle"),
            minAge: z.number().optional(),
            maxAge: z.number().optional(),
            maxParticipants: z.number().optional().default(10),
            planningMode: z.enum(["fixed_slot", "dynamic_grouping"]).optional(),
            description: z.string().optional(),
          }),
          execute: async ({ name, category, station, price, priceType, discipline, minAge, maxAge, maxParticipants, planningMode, description }) => {
            const product = await prisma.product.create({
              data: {
                tenantId, name, category, station, price, priceType,
                description: description ?? null,
                discipline: discipline ?? null,
                minAge: minAge ?? null, maxAge: maxAge ?? null,
                maxParticipants: maxParticipants ?? null,
                planningMode: planningMode ?? null,
                requiresGrouping: planningMode === "dynamic_grouping",
                isActive: true,
              },
            });
            return { productId: product.id, name, category, station, price: `${price} EUR`, planningMode };
          },
        }),

        searchReservations: tool({
          description: "Busca reservas por nombre de cliente, fecha o estado",
          parameters: z.object({
            clientName: z.string().optional().describe("Nombre del cliente (busqueda parcial)"),
            date: z.string().optional().describe("Fecha (YYYY-MM-DD)"),
            status: z.enum(["pendiente", "confirmada", "cancelada"]).optional(),
          }),
          execute: async ({ clientName, date, status }) => {
            const where: Record<string, unknown> = { tenantId };
            if (clientName) where.clientName = { contains: clientName, mode: "insensitive" };
            if (status) where.status = status;
            if (date) {
              const d = new Date(date);
              const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
              where.activityDate = { gte: dayStart, lte: dayEnd };
            }
            const reservations = await prisma.reservation.findMany({
              where, take: 10, orderBy: { activityDate: "desc" },
              include: { structuredParticipants: { select: { firstName: true, level: true, discipline: true } } },
            });
            return reservations.map((r) => ({
              id: r.id, client: r.clientName, phone: r.clientPhone,
              date: r.activityDate.toISOString().split("T")[0],
              station: r.station, status: r.status,
              participants: r.structuredParticipants.map((p) => `${p.firstName} (${p.discipline} ${p.level})`),
            }));
          },
        }),

        autoGroupDay: tool({
          description: "Agrupa automaticamente todos los participantes pendientes de un dia y estacion",
          parameters: z.object({
            date: z.string().describe("Fecha (YYYY-MM-DD)"),
            station: z.string().default("baqueira"),
          }),
          execute: async ({ date, station }) => {
            const { autoGroupUnits, applyGroupingSuggestion } = await import("@/lib/planning/grouping-engine");
            const result = await autoGroupUnits(tenantId, date, station);
            const applied = await applyGroupingSuggestion(tenantId, date, station, result.groups);
            return { groups: applied.created, participants: result.totalParticipants };
          },
        }),

        autoAssignInstructorsForDay: tool({
          description: "Asigna automaticamente profesores a todos los grupos sin asignar de un dia",
          parameters: z.object({
            date: z.string().describe("Fecha (YYYY-MM-DD)"),
            station: z.string().default("baqueira"),
          }),
          execute: async ({ date, station }) => {
            const { autoAssignInstructors, applyAssignmentSuggestions } = await import("@/lib/planning/instructor-assignment");
            const suggestions = await autoAssignInstructors(tenantId, date, station);
            const applied = await applyAssignmentSuggestions(suggestions);
            return { assigned: applied.assigned, details: suggestions.map((s) => `${s.instructorName} → grupo ${s.groupCellId.slice(-6)}`) };
          },
        }),

        clockInInstructor: tool({
          description: "Ficha entrada o salida de un profesor",
          parameters: z.object({
            instructorName: z.string().describe("Nombre del profesor"),
            action: z.enum(["entrada", "salida"]).describe("Fichar entrada o salida"),
          }),
          execute: async ({ instructorName, action }) => {
            const instructor = await prisma.instructor.findFirst({
              where: { tenantId, user: { name: { contains: instructorName, mode: "insensitive" as const } } },
            });
            if (!instructor) return { error: `Profesor "${instructorName}" no encontrado` };

            const today = new Date(); today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

            if (action === "entrada") {
              const existing = await prisma.instructorTimeEntry.findFirst({
                where: { tenantId, instructorId: instructor.id, date: { gte: today, lt: tomorrow }, clockOut: null },
              });
              if (existing) return { error: "Ya tiene fichaje abierto hoy" };
              await prisma.instructorTimeEntry.create({
                data: { tenantId, instructorId: instructor.id, date: today, clockIn: new Date(), source: "manual" },
              });
              return { success: true, instructor: instructorName, action: "entrada fichada" };
            } else {
              const entry = await prisma.instructorTimeEntry.findFirst({
                where: { tenantId, instructorId: instructor.id, date: { gte: today, lt: tomorrow }, clockOut: null },
              });
              if (!entry) return { error: "No tiene fichaje abierto hoy" };
              const now = new Date();
              const totalMin = Math.round((now.getTime() - entry.clockIn.getTime()) / 60000);
              await prisma.instructorTimeEntry.update({
                where: { id: entry.id },
                data: { clockOut: now, totalMinutes: totalMin, netMinutes: totalMin },
              });
              return { success: true, instructor: instructorName, action: "salida fichada", hours: (totalMin / 60).toFixed(1) };
            }
          },
        }),

        issueDiploma: tool({
          description: "Emite un diploma de nivel a un participante",
          parameters: z.object({
            participantName: z.string(),
            instructorName: z.string(),
            level: z.enum(["A", "B", "C", "D"]),
            discipline: z.enum(["esqui", "snow", "telemark", "freestyle"]).default("esqui"),
            station: z.string().default("baqueira"),
          }),
          execute: async ({ participantName, instructorName, level, discipline, station }) => {
            const diploma = await prisma.diploma.create({
              data: {
                tenantId, participantId: "manual", instructorId: "manual",
                participantName, instructorName, level, discipline, station,
              },
            });
            return { diplomaId: diploma.id, participant: participantName, level, discipline, instructor: instructorName };
          },
        }),

        getDayKPIs: tool({
          description: "Obtiene KPIs operativos del dia: ocupacion, grupos, incidencias",
          parameters: z.object({
            date: z.string().optional(),
            station: z.string().optional(),
          }),
          execute: async ({ date, station }) => {
            const d = date ? new Date(date) : new Date();
            const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
            const where: Record<string, unknown> = { tenantId, activityDate: { gte: dayStart, lte: dayEnd } };
            if (station) where.station = station;

            const groups = await prisma.groupCell.findMany({ where, include: { _count: { select: { units: true } } } });
            const incidents = await prisma.incident.count({ where: { tenantId, resolved: false } });
            const totalP = groups.reduce((s, g) => s + g._count.units, 0);
            const totalCap = groups.reduce((s, g) => s + g.maxParticipants, 0);
            const assigned = groups.filter((g) => g.instructorId).length;

            return {
              groups: groups.length, participants: totalP, capacity: totalCap,
              occupancy: totalCap > 0 ? `${Math.round((totalP / totalCap) * 100)}%` : "0%",
              assignedInstructors: assigned, unassigned: groups.length - assigned,
              openIncidents: incidents,
            };
          },
        }),
      },
      maxSteps: 5,
    });

    logger.info({ userId: session.userId }, "AI chat completed");
    return NextResponse.json({ text: result.text });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al procesar la solicitud",
      code: "AI_CHAT_FAILED",
      logContext: { tenantId },
    });
  }
}
