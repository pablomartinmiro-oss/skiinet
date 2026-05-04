export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { logCrmActivityAsync } from "@/lib/crm/activity-log";
import type { Prisma } from "@/generated/prisma/client";

const addNoteSchema = z.object({
  text: z.string().min(1, "El texto es obligatorio").max(5000),
});

type InternalNote = {
  id: string;
  text: string;
  authorId: string;
  authorName: string | null;
  createdAt: string;
};

/**
 * POST /api/crm/leads/[id]/notes
 * Append an internal note to Lead.internalNotes (JSON array).
 * Logs a "note_added" activity entry referencing the note.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId, userId, email } = session;
  const { id } = await params;

  try {
    const body = await request.json();
    const validated = validateBody(body, addNoteSchema);
    if (!validated.ok) return badRequest(validated.error);

    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      select: { id: true, internalNotes: true },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const existing = Array.isArray(lead.internalNotes)
      ? (lead.internalNotes as unknown as InternalNote[])
      : [];

    const newNote: InternalNote = {
      id: crypto.randomUUID(),
      text: validated.data.text.trim(),
      authorId: userId,
      authorName: email ?? null,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes: InternalNote[] = [...existing, newNote];

    await prisma.lead.update({
      where: { id },
      data: {
        internalNotes: updatedNotes as unknown as Prisma.InputJsonValue,
      },
    });

    logCrmActivityAsync({
      tenantId,
      entityType: "lead",
      entityId: id,
      action: "note_added",
      actorId: userId,
      actorName: email ?? null,
      details: { noteId: newNote.id, preview: newNote.text.slice(0, 120) },
    });

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "No se pudo añadir la nota",
      code: "LEAD_NOTE_ADD_ERROR",
      logContext: { tenantId, leadId: id },
    });
  }
}
