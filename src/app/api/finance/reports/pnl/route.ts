export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { apiError, badRequest } from "@/lib/api-response";

/**
 * GET /api/finance/reports/pnl?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Profit & Loss report for the given window. Aggregates:
 *   - Revenue: sum of paid Invoice.total in window
 *   - Expenses: sum of Expense.amount in window
 *   - Breakdown by ExpenseCategory and CostCenter
 *   - Monthly buckets (revenue / expenses / net) for charting
 *
 * Tenant-scoped. All amounts in EUR.
 */
export async function GET(request: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;

  const url = request.nextUrl;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) return badRequest("from y to son obligatorios (YYYY-MM-DD)");
  const startDate = new Date(from);
  const endDate = new Date(to);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return badRequest("Formato de fecha inválido");
  }

  try {
    const [paidInvoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          tenantId,
          status: "paid",
          paidAt: { gte: startDate, lte: endDate },
        },
        select: { id: true, total: true, paidAt: true },
      }),
      prisma.expense.findMany({
        where: {
          tenantId,
          date: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          amount: true,
          date: true,
          categoryId: true,
          costCenterId: true,
        },
      }),
    ]);

    // Hydrate category/costCenter names
    const categoryIds = Array.from(
      new Set(expenses.map((e) => e.categoryId).filter((x): x is string => !!x)),
    );
    const costCenterIds = Array.from(
      new Set(expenses.map((e) => e.costCenterId).filter((x): x is string => !!x)),
    );

    const [categories, costCenters] = await Promise.all([
      categoryIds.length
        ? prisma.expenseCategory.findMany({
            where: { id: { in: categoryIds }, tenantId },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      costCenterIds.length
        ? prisma.costCenter.findMany({
            where: { id: { in: costCenterIds }, tenantId },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const costCenterMap = new Map(costCenters.map((c) => [c.id, c.name]));

    // Totals
    const totalRevenue = paidInvoices.reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netResult = totalRevenue - totalExpenses;

    // By category
    const byCategoryMap = new Map<string, { name: string; amount: number; count: number }>();
    for (const e of expenses) {
      const key = e.categoryId ?? "__uncategorised__";
      const name = e.categoryId ? (categoryMap.get(e.categoryId) ?? "Sin nombre") : "Sin categoría";
      const cur = byCategoryMap.get(key) ?? { name, amount: 0, count: 0 };
      cur.amount += e.amount;
      cur.count += 1;
      byCategoryMap.set(key, cur);
    }

    // By cost center
    const byCostCenterMap = new Map<string, { name: string; amount: number; count: number }>();
    for (const e of expenses) {
      const key = e.costCenterId ?? "__none__";
      const name = e.costCenterId
        ? (costCenterMap.get(e.costCenterId) ?? "Sin nombre")
        : "Sin centro de coste";
      const cur = byCostCenterMap.get(key) ?? { name, amount: 0, count: 0 };
      cur.amount += e.amount;
      cur.count += 1;
      byCostCenterMap.set(key, cur);
    }

    // Monthly buckets (YYYY-MM → { revenue, expenses, net })
    const monthly = new Map<string, { revenue: number; expenses: number }>();
    for (const inv of paidInvoices) {
      if (!inv.paidAt) continue;
      const key = monthKey(inv.paidAt);
      const cur = monthly.get(key) ?? { revenue: 0, expenses: 0 };
      cur.revenue += inv.total;
      monthly.set(key, cur);
    }
    for (const e of expenses) {
      const key = monthKey(e.date);
      const cur = monthly.get(key) ?? { revenue: 0, expenses: 0 };
      cur.expenses += e.amount;
      monthly.set(key, cur);
    }
    const monthlySorted = Array.from(monthly.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, agg]) => ({
        month,
        revenue: round2(agg.revenue),
        expenses: round2(agg.expenses),
        net: round2(agg.revenue - agg.expenses),
      }));

    return NextResponse.json({
      from,
      to,
      totalRevenue: round2(totalRevenue),
      totalExpenses: round2(totalExpenses),
      netResult: round2(netResult),
      byCategory: Array.from(byCategoryMap.values()).map((v) => ({
        name: v.name,
        amount: round2(v.amount),
        count: v.count,
      })),
      byCostCenter: Array.from(byCostCenterMap.values()).map((v) => ({
        name: v.name,
        amount: round2(v.amount),
        count: v.count,
      })),
      monthly: monthlySorted,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al generar el informe P&L",
      code: "PNL_REPORT_ERROR",
      logContext: { tenantId },
    });
  }
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
