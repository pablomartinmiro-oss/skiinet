export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, updateLeadSchema } from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const modError = await requireModule(session.tenantId, "leads");
  if (modError) return modError;

  const { tenantId } = session;
  const { id } = await params;

  try {
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to fetch lead",
      code: "LEAD_FETCH_ERROR",
      logContext: { tenantId, leadId: id },
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const modError = await requireModule(session.tenantId, "leads");
  if (modError) return modError;

  const { tenantId } = session;
  const { id } = await params;
  const log = logger.child({ tenantId, path: `/api/leads/${id}` });

  try {
    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = validateBody(body, updateLeadSchema);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const data = validated.data;

    const updateData: Prisma.LeadUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.status !== undefined) {
      updateData.status = data.status;
      updateData.pipelineStage = data.pipelineStage ?? data.status;
    } else if (data.pipelineStage !== undefined) {
      updateData.pipelineStage = data.pipelineStage;
    }
    if (data.score !== undefined) updateData.score = data.score;
    if (data.assignedTo !== undefined) {
      updateData.assignedUser = data.assignedTo
        ? { connect: { id: data.assignedTo } }
        : { disconnect: true };
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.customFields !== undefined) {
      updateData.customFields = data.customFields as Prisma.InputJsonValue;
    }
    if (data.lastContactedAt !== undefined) updateData.lastContactedAt = data.lastContactedAt;
    if (data.convertedAt !== undefined) updateData.convertedAt = data.convertedAt;
    if (data.lostReason !== undefined) updateData.lostReason = data.lostReason;

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });

    log.info({ leadId: id }, "Lead updated");
    return NextResponse.json({ lead });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to update lead",
      code: "LEAD_UPDATE_ERROR",
      logContext: { tenantId, leadId: id },
    });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const modError = await requireModule(session.tenantId, "leads");
  if (modError) return modError;

  const { tenantId } = session;
  const { id } = await params;
  const log = logger.child({ tenantId, path: `/api/leads/${id}` });

  try {
    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    await prisma.lead.delete({ where: { id } });
    log.info({ leadId: id }, "Lead deleted");
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to delete lead",
      code: "LEAD_DELETE_ERROR",
      logContext: { tenantId, leadId: id },
    });
  }
}
