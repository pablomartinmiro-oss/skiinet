export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import { validateBody, createQuoteSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/email/resend";
import { buildQuoteConfirmationHTML } from "@/lib/email/templates/quote-confirmation";
import { generateDocumentNumber } from "@/lib/documents/numbering";

export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;
  const log = logger.child({ tenantId, path: "/api/quotes" });
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const destination = searchParams.get("destination");

  try {
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    if (destination) where.destination = destination;

    const quotes = await prisma.quote.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    log.info({ count: quotes.length }, "Quotes fetched");
    return NextResponse.json({ quotes });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to fetch quotes",
      code: "QUOTES_FETCH_ERROR",
      logContext: { tenantId },
    });
  }
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;

  const { tenantId } = session;
  const log = logger.child({ tenantId, path: "/api/quotes" });

  try {
    const body = await request.json();
    const validated = validateBody(body, createQuoteSchema);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const data = validated.data;

    const number = await generateDocumentNumber(tenantId, "quote", {
      generatedBy: session.userId,
      context: "manual",
    });

    const quote = await prisma.quote.create({
      data: {
        tenantId,
        number,
        clientName: data.clientName,
        clientEmail: data.clientEmail || null,
        clientPhone: data.clientPhone || null,
        clientNotes: data.clientNotes || null,
        ghlContactId: data.ghlContactId || null,
        destination: data.destination,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        adults: data.adults,
        children: data.children,
        wantsAccommodation: data.wantsAccommodation,
        wantsForfait: data.wantsForfait,
        wantsClases: data.wantsClases,
        wantsEquipment: data.wantsEquipment,
        status: "nuevo",
        totalAmount: 0,
      },
      include: { items: true },
    });

    log.info({ quoteId: quote.id }, "Quote created");

    // Send acknowledgement email to client (non-blocking)
    if (data.clientEmail) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slug: true, name: true },
      });
      const storefrontUrl = tenant?.slug
        ? `${process.env.AUTH_URL ?? ""}/s/${tenant.slug}/presupuesto`
        : undefined;
      const quoteNumber = quote.id.slice(-8).toUpperCase();
      const formatDate = (d: string | Date) =>
        new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

      sendEmail({
        to: data.clientEmail,
        subject: `Tu presupuesto ha sido recibido — Skicenter`,
        html: buildQuoteConfirmationHTML({
          quoteNumber,
          clientName: data.clientName,
          destination: data.destination,
          checkIn: formatDate(data.checkIn),
          checkOut: formatDate(data.checkOut),
          totalAmount: 0,
          items: [],
          storefrontUrl,
        }),
      }).catch((err) => log.error({ err, quoteId: quote.id }, "Quote confirmation email failed"));
    }

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to create quote",
      code: "QUOTE_CREATE_ERROR",
      logContext: { tenantId },
    });
  }
}
