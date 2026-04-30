export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, createLeadSchema, leadFilterSchema } from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const modError = await requireModule(session.tenantId, "leads");
  if (modError) return modError;

  const { tenantId } = session;
  const log = logger.child({ tenantId, path: "/api/leads" });

  try {
    const url = request.nextUrl;
    const parsed = leadFilterSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid filters" }, { status: 400 });
    }
    const f = parsed.data;

    const where: Prisma.LeadWhereInput = { tenantId };
    if (f.status) where.status = f.status;
    if (f.source) where.source = f.source;
    if (f.assignedTo) where.assignedTo = f.assignedTo;
    if (typeof f.minScore === "number" || typeof f.maxScore === "number") {
      where.score = {
        ...(typeof f.minScore === "number" ? { gte: f.minScore } : {}),
        ...(typeof f.maxScore === "number" ? { lte: f.maxScore } : {}),
      };
    }
    if (f.fromDate || f.toDate) {
      where.createdAt = {
        ...(f.fromDate ? { gte: f.fromDate } : {}),
        ...(f.toDate ? { lte: f.toDate } : {}),
      };
    }
    if (f.search) {
      const q = f.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { [f.sortBy]: f.sortDir },
        skip: (f.page - 1) * f.pageSize,
        take: f.pageSize,
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    log.info({ count: leads.length, total }, "Leads fetched");
    return NextResponse.json({ leads, total, page: f.page, pageSize: f.pageSize });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to fetch leads",
      code: "LEADS_FETCH_ERROR",
      logContext: { tenantId },
    });
  }
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const modError = await requireModule(session.tenantId, "leads");
  if (modError) return modError;

  const { tenantId } = session;
  const log = logger.child({ tenantId, path: "/api/leads" });

  try {
    const body = await request.json();
    const validated = validateBody(body, createLeadSchema);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const data = validated.data;

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        source: data.source,
        status: data.status,
        pipelineStage: data.pipelineStage ?? data.status,
        score: data.score,
        assignedTo: data.assignedTo ?? null,
        notes: data.notes ?? null,
        tags: data.tags ?? [],
        customFields: (data.customFields ?? {}) as Prisma.InputJsonValue,
        lastContactedAt: data.lastContactedAt ?? null,
      },
    });

    log.info({ leadId: lead.id }, "Lead created");
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to create lead",
      code: "LEAD_CREATE_ERROR",
      logContext: { tenantId },
    });
  }
}
