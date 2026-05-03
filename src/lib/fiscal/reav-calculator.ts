/**
 * REAV (Régimen Especial de Agencias de Viaje) calculation engine.
 *
 * Pure math, no DB access. The Spanish REAV regime taxes the agency
 * margin (what the customer paid minus what the providers charged the
 * agency), not the gross sale. This module computes the taxable base
 * and the IVA owed.
 *
 * Reference: Ley 37/1992 IVA, Capítulo VI (arts. 141-147).
 */

export type ReavConfig = {
  /** Default IVA rate (decimal, e.g. 0.21 for 21%). */
  vatRate: number;
  /** Whether the customer-facing prices already include VAT. */
  pricesIncludeVat: boolean;
};

export type ReavLine = {
  /** Net amount the agency charged the customer for this line (without VAT if pricesIncludeVat=false). */
  saleAmount: number;
  /** Total provider cost the agency paid for this line. */
  providerCost: number;
};

export type ReavLineResult = {
  saleAmount: number;
  providerCost: number;
  /** Margin = saleAmount - providerCost. If negative, treated as 0 (no negative tax base). */
  margin: number;
  /** Margin treated as the IVA-included amount; tax base = margin / (1 + vatRate). */
  taxBase: number;
  /** IVA owed on this line. */
  taxAmount: number;
};

export type ReavInput = {
  config: ReavConfig;
  lines: ReavLine[];
};

export type ReavResult = {
  lines: ReavLineResult[];
  /** Sum of saleAmount across all lines. */
  totalSale: number;
  /** Sum of providerCost across all lines. */
  totalCost: number;
  /** Sum of margin across all lines (negatives clamped). */
  totalMargin: number;
  /** Sum of taxBase. */
  totalTaxBase: number;
  /** Sum of taxAmount. */
  totalTaxAmount: number;
  /** Convenience — applied vatRate echoed back. */
  vatRate: number;
};

export type ValidationIssue = { code: string; message: string };
export type ValidationResult = { valid: boolean; issues: ValidationIssue[] };

/**
 * Validate a REAV configuration before persisting/calculating.
 * Catches the most common operator mistakes (negative VAT, missing flag).
 */
export function validarConfiguracionREAV(config: ReavConfig): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (typeof config.vatRate !== "number" || Number.isNaN(config.vatRate)) {
    issues.push({ code: "VAT_NAN", message: "vatRate must be a finite number" });
  } else {
    if (config.vatRate < 0) {
      issues.push({ code: "VAT_NEGATIVE", message: "vatRate cannot be negative" });
    }
    if (config.vatRate > 1) {
      issues.push({
        code: "VAT_TOO_LARGE",
        message: "vatRate must be a decimal (e.g. 0.21 for 21%) — values >1 are likely a percentage typo",
      });
    }
  }

  if (typeof config.pricesIncludeVat !== "boolean") {
    issues.push({
      code: "PRICES_INCLUDE_VAT_REQUIRED",
      message: "pricesIncludeVat must be set explicitly (true/false)",
    });
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Calculate REAV for a single line.
 * Margin clamped to 0 if negative (no negative tax base allowed).
 */
export function calcularLineaREAV(
  config: ReavConfig,
  line: ReavLine,
): ReavLineResult {
  const sale = Math.max(0, line.saleAmount);
  const cost = Math.max(0, line.providerCost);
  const margin = Math.max(0, sale - cost);

  // The margin is treated as the IVA-included amount: base = margin / (1 + rate).
  // If the agency's prices already include IVA we still pull the IVA out of the
  // margin — the regime taxes the *margin*, not the gross sale.
  const taxBase = margin / (1 + config.vatRate);
  const taxAmount = margin - taxBase;

  return {
    saleAmount: round2(sale),
    providerCost: round2(cost),
    margin: round2(margin),
    taxBase: round2(taxBase),
    taxAmount: round2(taxAmount),
  };
}

/**
 * Aggregate REAV calculation over multiple cost/sale lines.
 */
export function calcularREAV(input: ReavInput): ReavResult {
  const lines = input.lines.map((l) => calcularLineaREAV(input.config, l));

  let totalSale = 0;
  let totalCost = 0;
  let totalMargin = 0;
  let totalTaxBase = 0;
  let totalTaxAmount = 0;

  for (const r of lines) {
    totalSale += r.saleAmount;
    totalCost += r.providerCost;
    totalMargin += r.margin;
    totalTaxBase += r.taxBase;
    totalTaxAmount += r.taxAmount;
  }

  return {
    lines,
    totalSale: round2(totalSale),
    totalCost: round2(totalCost),
    totalMargin: round2(totalMargin),
    totalTaxBase: round2(totalTaxBase),
    totalTaxAmount: round2(totalTaxAmount),
    vatRate: input.config.vatRate,
  };
}

/**
 * Quick single-shot REAV: given a sale total and a cost percentage,
 * return the margin tax breakdown. Useful for ad-hoc calculations
 * without lines (e.g. UI live preview).
 */
export function calcularREAVSimple(opts: {
  saleAmount: number;
  costPercent: number;       // 0..1 (e.g. 0.7 means cost is 70% of sale)
  vatRate: number;           // 0..1 (e.g. 0.21)
}): ReavLineResult & { vatRate: number } {
  const sale = Math.max(0, opts.saleAmount);
  const cost = sale * Math.max(0, Math.min(1, opts.costPercent));
  const result = calcularLineaREAV({ vatRate: opts.vatRate, pricesIncludeVat: true }, {
    saleAmount: sale,
    providerCost: cost,
  });
  return { ...result, vatRate: opts.vatRate };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
