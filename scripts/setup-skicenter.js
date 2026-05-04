/**
 * Skicenter prod setup — uses raw SQL via `pg` (no Prisma).
 *
 * Reads JSON payload from stdin with templates + products + seasonCalendar.
 * Connects via DATABASE_URL env var.
 *
 * Usage:
 *   railway run --service Postgres-p6ed -- bash -c '
 *     DATABASE_URL="$DATABASE_PUBLIC_URL" node scripts/setup-skicenter.js
 *   ' < /tmp/skicenter-payload.json
 */

const fs = require("fs");
const { Client } = require("pg");
const crypto = require("crypto");

(async () => {
  const TENANT_ID = "cmn3gorz400004cov5kzoh3k2";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }

  const stdin = fs.readFileSync(0, "utf-8");
  const payload = JSON.parse(stdin);

  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  console.log("=== SKICENTER PROD SETUP ===");
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(
    `Payload: ${payload.emailTemplates.length} emails, ${payload.pdfTemplates.length} PDFs, ${payload.products.length} products, ${payload.seasonCalendar.length} seasons`,
  );

  function cuid() {
    return "c" + crypto.randomBytes(12).toString("base64url").slice(0, 23);
  }

  // ── 1. Email templates ──────────────────────────────
  let emailUpserted = 0;
  for (const t of payload.emailTemplates) {
    const existing = await c.query(
      `SELECT id, "isCustom" FROM "EmailTemplate" WHERE "tenantId"=$1 AND "templateKey"=$2`,
      [TENANT_ID, t.templateKey],
    );
    if (existing.rows[0]?.isCustom) {
      console.log(`  · ${t.templateKey}: skip (isCustom)`);
      continue;
    }
    if (existing.rows.length) {
      await c.query(
        `UPDATE "EmailTemplate" SET name=$1, description=$2, category=$3, recipient=$4, subject=$5, "bodyHtml"=$6, variables=$7, "isActive"=true, "updatedAt"=NOW() WHERE id=$8`,
        [t.name, t.description, t.category, t.recipient, t.subject, t.bodyHtml, t.variables, existing.rows[0].id],
      );
    } else {
      await c.query(
        `INSERT INTO "EmailTemplate" (id, "tenantId", "templateKey", name, description, category, recipient, subject, "bodyHtml", variables, "isCustom", "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,true,NOW(),NOW())`,
        [cuid(), TENANT_ID, t.templateKey, t.name, t.description, t.category, t.recipient, t.subject, t.bodyHtml, t.variables],
      );
    }
    emailUpserted++;
  }
  console.log(`✓ Email templates upserted: ${emailUpserted}/${payload.emailTemplates.length}`);

  // ── 2. PDF templates ────────────────────────────────
  let pdfUpserted = 0;
  for (const t of payload.pdfTemplates) {
    const existing = await c.query(
      `SELECT id, "isCustom" FROM "PdfTemplate" WHERE "tenantId"=$1 AND "templateKey"=$2`,
      [TENANT_ID, t.templateKey],
    );
    if (existing.rows[0]?.isCustom) {
      console.log(`  · ${t.templateKey}: skip (isCustom)`);
      continue;
    }
    const params = [
      t.name, t.description, t.category, t.logoUrl, t.headerColor, t.accentColor,
      t.companyName, t.companyAddress, t.companyPhone, t.companyEmail, t.companyNif,
      t.footerText, t.legalText, t.showLogo, t.showWatermark, t.bodyHtml, t.variables,
    ];
    if (existing.rows.length) {
      await c.query(
        `UPDATE "PdfTemplate" SET name=$1, description=$2, category=$3, "logoUrl"=$4, "headerColor"=$5, "accentColor"=$6, "companyName"=$7, "companyAddress"=$8, "companyPhone"=$9, "companyEmail"=$10, "companyNif"=$11, "footerText"=$12, "legalText"=$13, "showLogo"=$14, "showWatermark"=$15, "bodyHtml"=$16, variables=$17, "isActive"=true, "updatedAt"=NOW() WHERE id=$18`,
        [...params, existing.rows[0].id],
      );
    } else {
      await c.query(
        `INSERT INTO "PdfTemplate" (id, "tenantId", "templateKey", name, description, category, "logoUrl", "headerColor", "accentColor", "companyName", "companyAddress", "companyPhone", "companyEmail", "companyNif", "footerText", "legalText", "showLogo", "showWatermark", "bodyHtml", variables, "isCustom", "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,false,true,NOW(),NOW())`,
        [cuid(), TENANT_ID, t.templateKey, ...params],
      );
    }
    pdfUpserted++;
  }
  console.log(`✓ PDF templates upserted: ${pdfUpserted}/${payload.pdfTemplates.length}`);

  // ── 3. Products ─────────────────────────────────────
  const existingProd = await c.query(
    `SELECT COUNT(*)::int AS cnt FROM "Product" WHERE "tenantId"=$1`,
    [TENANT_ID],
  );
  if (existingProd.rows[0].cnt > 0) {
    console.log(`✓ Products: ${existingProd.rows[0].cnt} ya existen, skip`);
  } else {
    let productCreated = 0;
    for (const p of payload.products) {
      await c.query(
        `INSERT INTO "Product" (id, "tenantId", category, name, station, description, "personType", tier, "includesHelmet", "priceType", price, "pricingMatrix", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,NOW(),NOW())`,
        [
          cuid(), TENANT_ID, p.category, p.name, p.station,
          p.description ?? null,
          p.personType ?? null,
          p.tier ?? null,
          p.includesHelmet ?? false,
          p.priceType, p.price,
          JSON.stringify(p.pricingMatrix),
          p.sortOrder ?? 0,
        ],
      );
      productCreated++;
    }
    console.log(`✓ Products created: ${productCreated}`);
  }

  // ── 4. Season calendar ──────────────────────────────
  const existingSeasons = await c.query(
    `SELECT COUNT(*)::int AS cnt FROM "SeasonCalendar" WHERE "tenantId"=$1`,
    [TENANT_ID],
  );
  if (existingSeasons.rows[0].cnt > 0) {
    console.log(`✓ SeasonCalendar: ${existingSeasons.rows[0].cnt} ya existen, skip`);
  } else {
    let seasonsCreated = 0;
    for (const s of payload.seasonCalendar) {
      await c.query(
        `INSERT INTO "SeasonCalendar" (id, "tenantId", station, season, "startDate", "endDate", label, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`,
        [cuid(), TENANT_ID, s.station, s.season, new Date(s.startDate), new Date(s.endDate), s.label],
      );
      seasonsCreated++;
    }
    console.log(`✓ SeasonCalendar created: ${seasonsCreated}`);
  }

  // ── 5. Switch dataMode to live ──────────────────────
  const before = await c.query(
    `SELECT "dataMode", slug, name FROM "Tenant" WHERE id=$1`,
    [TENANT_ID],
  );
  console.log(`\nTenant before: ${JSON.stringify(before.rows[0])}`);

  if (before.rows[0]?.dataMode !== "live") {
    await c.query(`UPDATE "Tenant" SET "dataMode"='live' WHERE id=$1`, [TENANT_ID]);
    console.log("✓ dataMode switched: mock → live");
  } else {
    console.log("✓ dataMode already 'live'");
  }

  // ── 6. Final inventory ──────────────────────────────
  const counts = {};
  for (const tbl of ["EmailTemplate", "PdfTemplate", "Product", "SeasonCalendar", "Location"]) {
    const r = await c.query(
      `SELECT COUNT(*)::int AS cnt FROM "${tbl}" WHERE "tenantId"=$1`,
      [TENANT_ID],
    );
    counts[tbl] = r.rows[0].cnt;
  }
  console.log("\n=== FINAL ===");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(18)} ${v}`);

  await c.end();
  console.log("\n✓ Setup complete");
})().catch((e) => {
  console.error("FATAL:", e.message);
  console.error(e.stack);
  process.exit(1);
});
