export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";
import {
  validateBody,
  publicSubmitReviewSchema,
} from "@/lib/validation";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const log = logger.child({ path: "/api/reviews/public/submit" });

  try {
    const rl = await rateLimit(getClientIP(request), "submit");
    if (rl) return rl;

    const body = await request.json();
    const validated = validateBody(body, publicSubmitReviewSchema);
    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error },
        { status: 400 }
      );
    }
    const data = validated.data;

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Verify module is enabled
    const moduleConfig = await prisma.moduleConfig.findFirst({
      where: {
        tenantId: data.tenantId,
        module: "reviews",
        isEnabled: true,
      },
    });
    if (!moduleConfig) {
      return NextResponse.json(
        { error: "Reviews not enabled for this tenant" },
        { status: 403 }
      );
    }

    // Verified-booking signal: if the reviewer's email matches any reservation
    // in this tenant we mark the review as verified. Used to render a trust
    // badge in public listings.
    let verifiedBooking = false;
    if (data.authorEmail) {
      const matchingRes = await prisma.reservation.findFirst({
        where: {
          tenantId: data.tenantId,
          clientEmail: data.authorEmail.trim().toLowerCase(),
        },
        select: { id: true },
      });
      verifiedBooking = !!matchingRes;
    }

    const review = await prisma.review.create({
      data: {
        tenantId: data.tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        rating: data.rating,
        authorName: data.authorName,
        authorEmail: data.authorEmail ?? null,
        title: data.title ?? null,
        body: data.body,
        stayDate: data.stayDate ?? null,
        status: "pending",
        verifiedBooking,
      },
    });

    log.info(
      { reviewId: review.id, tenantId: data.tenantId, verifiedBooking },
      "Public review submitted"
    );
    return NextResponse.json(
      { success: true, reviewId: review.id },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error, {
      publicMessage: "Failed to submit review",
      code: "REVIEWS_PUBLIC_SUBMIT_ERROR",
    });
  }
}
