export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, importLeadsSchema } from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const modError = await requireModule(session.tenantId, "leads");
  if (modError) return modError;

  const { tenantId } = session;
  const log = logger.child({ tenantId, path: "/api/leads/import" });

  try {
    const body = await request.json();
    const validated = validateBody(body, importLeadsSchema);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const rows = validated.data.leads.map((data) => ({
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
    }));

    const result = await prisma.lead.createMany({ data: rows, skipDuplicates: false });

    log.info({ count: result.count }, "Leads imported");
    return NextResponse.json({ count: result.count }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to import leads",
      code: "LEADS_IMPORT_ERROR",
      logContext: { tenantId },
    });
  }
}
