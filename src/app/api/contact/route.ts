export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";
import {
  buildContactFormNotificationHTML,
  buildContactFormConfirmationHTML,
} from "@/lib/email/templates/contact-form-notification";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { validateBody, contactFormSchema } from "@/lib/validation";
import { intakeLead } from "@/lib/leads/intake";
import { resolveTenantForPublicRequest } from "@/lib/leads/resolve-tenant";

const log = logger.child({ module: "contact-form" });

export async function POST(req: NextRequest) {
  const rl = await rateLimit(getClientIP(req), "public");
  if (rl) return rl;

  const body = await req.json();

  // Honeypot check — bots fill hidden fields (check before validation)
  if (body.website) {
    return NextResponse.json({ success: true });
  }

  const validation = validateBody(body, contactFormSchema);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { nombre, email, telefono, asunto, mensaje } = validation.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Resolve tenant — body.tenantSlug if the form passes it, else DEFAULT_TENANT_ID.
  // Public marketing /contacto has no slug context so it relies on env var.
  const tenantSlug =
    typeof body.tenantSlug === "string" ? body.tenantSlug : null;
  const tenantResult = await resolveTenantForPublicRequest({ tenantSlug });
  if (!tenantResult.ok) {
    log.error(
      { reason: tenantResult.reason, tenantSlug },
      "Could not resolve tenant for contact form",
    );
    return NextResponse.json(
      { error: "Configuracion incompleta. Contacta con soporte." },
      { status: 500 },
    );
  }
  const tenantId = tenantResult.tenantId;

  // Rate limit by tenant + email — max 3 per hour
  try {
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const recentCount = await prisma.lead.count({
      where: {
        tenantId,
        email: normalizedEmail,
        source: "contact_form",
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Has enviado demasiados mensajes. Intentalo de nuevo mas tarde." },
        { status: 429 },
      );
    }
  } catch (err) {
    log.warn({ err }, "Rate limit check failed, continuing");
  }

  // Persist as Lead
  try {
    const subject = asunto || "Informacion general";
    await intakeLead({
      tenantId,
      name: nombre.trim(),
      email: normalizedEmail,
      phone: telefono?.trim() || null,
      source: "contact_form",
      notes: `[${subject}] ${mensaje.trim()}`,
      tags: ["web-contacto", `asunto:${subject.toLowerCase()}`],
    });
  } catch (err) {
    log.error({ err, tenantId }, "Could not persist contact form as Lead");
  }

  // Send emails via Resend
  await sendEmails({
    nombre: nombre.trim(),
    email: normalizedEmail,
    telefono: telefono?.trim(),
    asunto: asunto || undefined,
    mensaje: mensaje.trim(),
  });

  // Create GHL contact for the resolved tenant (no more findFirst bug)
  await createGHLContact({
    tenantId,
    nombre: nombre.trim(),
    email: normalizedEmail,
    telefono: telefono?.trim(),
  });

  return NextResponse.json({ success: true });
}

async function sendEmails(data: {
  nombre: string;
  email: string;
  telefono?: string;
  asunto?: string;
  mensaje: string;
}) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      log.warn("RESEND_API_KEY not set, skipping contact form emails");
      return;
    }

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    // Notification to team
    await resend.emails.send({
      from: "Skicenter Web <no-reply@skicenter.es>",
      to: "reservas@skicenter.es",
      replyTo: data.email,
      subject: `[Web] Nuevo contacto: ${data.asunto || "General"} — ${data.nombre}`,
      html: buildContactFormNotificationHTML(data),
    });

    // Confirmation to client
    await resend.emails.send({
      from: "Skicenter <no-reply@skicenter.es>",
      to: data.email,
      subject: "Hemos recibido tu mensaje — Skicenter",
      html: buildContactFormConfirmationHTML({ nombre: data.nombre }),
    });
  } catch (err) {
    log.error({ err }, "Failed to send contact form emails");
  }
}

async function createGHLContact(data: {
  tenantId: string;
  nombre: string;
  email: string;
  telefono?: string;
}) {
  try {
    // Use the resolved tenant — never findFirst across all tenants
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      select: { ghlLocationId: true, ghlAccessToken: true },
    });

    if (!tenant?.ghlAccessToken || !tenant.ghlLocationId) return;

    const { decrypt } = await import("@/lib/encryption");
    const token = decrypt(tenant.ghlAccessToken);

    const nameParts = data.nombre.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || undefined;

    const response = await fetch(
      "https://services.leadconnectorhq.com/contacts/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Version: "2021-07-28",
        },
        body: JSON.stringify({
          locationId: tenant.ghlLocationId,
          firstName,
          lastName,
          email: data.email,
          phone: data.telefono || undefined,
          tags: ["web-contacto"],
          source: "Formulario Web",
        }),
      },
    );

    if (!response.ok) {
      log.warn({ status: response.status }, "GHL contact creation failed");
    }
  } catch (err) {
    log.error({ err }, "Failed to create GHL contact");
  }
}
