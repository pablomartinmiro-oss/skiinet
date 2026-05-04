/**
 * Base email layout — table-based HTML for maximum email-client
 * compatibility (Outlook, Gmail, Apple Mail, etc.).
 *
 * Uses inline styles only — no <style> block, no class names that
 * could be stripped. Single 600px container, mobile responsive.
 */

import type { Brand } from "./brand-skicenter";

export type EmailContent = {
  /** Hero badge/eyebrow text above the h1, optional */
  eyebrow?: string;
  /** Main heading */
  heading: string;
  /** Optional subtext under heading */
  subheading?: string;
  /** Main body — array of HTML strings rendered as paragraphs/blocks */
  bodyBlocks: string[];
  /** Primary CTA button (optional) */
  cta?: { label: string; url: string };
  /** Optional summary table — renders as a 2-col key/value list */
  summary?: Array<{ label: string; value: string }>;
  /** Closing line shown right above the signature/footer */
  closing?: string;
};

export function renderEmail(brand: Brand, content: EmailContent): string {
  const cta = content.cta
    ? `
    <tr>
      <td align="center" style="padding: 24px 0 8px;">
        <a href="${escape(content.cta.url)}"
           style="display:inline-block;background:${brand.accent};color:#FFFFFF;text-decoration:none;font-weight:600;padding:14px 32px;border-radius:6px;font-size:15px;letter-spacing:0.2px;">
          ${escape(content.cta.label)}
        </a>
      </td>
    </tr>`
    : "";

  const summary = content.summary?.length
    ? `
    <tr>
      <td style="padding:8px 0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:${brand.surface};border:1px solid ${brand.border};border-radius:8px;">
          ${content.summary
            .map(
              (row) => `
              <tr>
                <td style="padding:12px 18px;border-bottom:1px solid ${brand.border};font-size:13px;color:${brand.textSecondary};font-weight:500;letter-spacing:0.3px;text-transform:uppercase;">
                  ${escape(row.label)}
                </td>
                <td style="padding:12px 18px;border-bottom:1px solid ${brand.border};font-size:14px;color:${brand.textPrimary};text-align:right;font-weight:600;">
                  ${row.value}
                </td>
              </tr>`,
            )
            .join("")}
        </table>
      </td>
    </tr>`
    : "";

  const eyebrow = content.eyebrow
    ? `
    <tr>
      <td style="padding-bottom:8px;font-size:12px;color:${brand.accent};font-weight:600;letter-spacing:1.2px;text-transform:uppercase;">
        ${escape(content.eyebrow)}
      </td>
    </tr>`
    : "";

  const subheading = content.subheading
    ? `
    <tr>
      <td style="padding-bottom:24px;font-size:15px;color:${brand.textSecondary};line-height:1.6;">
        ${content.subheading}
      </td>
    </tr>`
    : "";

  const bodyBlocks = content.bodyBlocks
    .map(
      (b) => `
      <tr>
        <td style="padding:0 0 16px;font-size:15px;line-height:1.7;color:${brand.textPrimary};">
          ${b}
        </td>
      </tr>`,
    )
    .join("");

  const closing = content.closing
    ? `
    <tr>
      <td style="padding:24px 0 0;font-size:14px;color:${brand.textSecondary};line-height:1.6;">
        ${content.closing}
      </td>
    </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escape(content.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${brand.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preheader (hidden) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;visibility:hidden;">
    ${escape(content.subheading ?? content.heading)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.surface};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,42,74,0.06);">
          <!-- Header bar -->
          <tr>
            <td style="background:${brand.primary};padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:0.3px;">
                    ${escape(brand.name)}
                  </td>
                  <td align="right" style="font-size:12px;color:#FFFFFF;opacity:0.85;">
                    ${escape(brand.tagline)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${eyebrow}
                <tr>
                  <td style="padding-bottom:12px;font-size:26px;font-weight:700;color:${brand.textPrimary};line-height:1.3;letter-spacing:-0.3px;">
                    ${escape(content.heading)}
                  </td>
                </tr>
                ${subheading}
                ${bodyBlocks}
                ${summary}
                ${cta}
                ${closing}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${brand.surface};padding:24px 32px;border-top:1px solid ${brand.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:13px;color:${brand.textPrimary};font-weight:600;padding-bottom:6px;">
                    ${escape(brand.name)}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:${brand.textSecondary};line-height:1.6;padding-bottom:4px;">
                    ${escape(brand.address)}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:${brand.textSecondary};line-height:1.6;padding-bottom:4px;">
                    ${escape(brand.email)} · ${escape(brand.phone)} · ${escape(brand.hours)}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:11px;color:${brand.textSecondary};opacity:0.75;padding-top:8px;">
                    ${escape(brand.registry)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Anti-spam disclaimer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin-top:16px;">
          <tr>
            <td align="center" style="font-size:11px;color:${brand.textSecondary};opacity:0.7;">
              Recibes este email porque has solicitado información o realizado una operación con ${escape(brand.name)}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escape(s: string | undefined | null): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
