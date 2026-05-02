export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth/guard";
import { requireModule } from "@/lib/modules/guard";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/api-response";

type GroupBy = "channel" | "product" | "category" | "costCenter" | "month";

const VALID_GROUPS: GroupBy[] = [
  "channel",
  "product",
  "category",
  "costCenter",
  "month",
];

export async function GET(req: NextRequest) {
  const [session, authError] = await requireTenant();
  if (authError) return authError;
  const { tenantId } = session;
  const modErr = await requireModule(tenantId, "finance");
  if (modErr) return modErr;

  const log = logger.child({ tenantId, path: "/api/finance/reports" });
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const groupBy = (sp.get("groupBy") as GroupBy) || "month";

  if (!VALID_GROUPS.includes(groupBy)) {
    return NextResponse.json(
      { error: `groupBy invalido. Opciones: ${VALID_GROUPS.join(", ")}` },
      { status: 400 }
    );
  }

  const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  // `to` arrives as YYYY-MM-DD which `new Date()` parses as midnight UTC, i.e.
  // start-of-day. Without this normalisation, invoices paid on the same day
  // were excluded from the month — the cause of the "Ingresos mes = 0€" bug.
  const dateTo = to ? new Date(`${to}T23:59:59.999Z`) : new Date();

  try {
    const [invoices, expenses] = await Promise.all([
      fetchPaidInvoices(tenantId, dateFrom, dateTo),
      fetchExpenses(tenantId, dateFrom, dateTo),
    ]);

    const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const revenueByGroup = buildRevenueGroups(invoices, groupBy, totalRevenue);
    const expensesByGroup = buildExpenseGroups(expenses, groupBy, totalExpenses);
    const monthlyTrend = buildMonthlyTrend(invoices, expenses, dateFrom, dateTo);

    log.info({ groupBy, from: dateFrom, to: dateTo }, "P&L report generated");

    return NextResponse.json({
      summary: {
        totalRevenue: round2(totalRevenue),
        totalExpenses: round2(totalExpenses),
        netProfit: round2(netProfit),
        profitMargin: round2(profitMargin),
      },
      revenueByGroup,
      expensesByGroup,
      monthlyTrend,
    });
  } catch (error) {
    return apiError(error, {
      publicMessage: "Error al generar informe financiero",
      code: "FINANCE_REPORTS_ERROR",
      logContext: { tenantId },
    });
  }
}

// ---------- helpers ----------

interface InvoiceRow {
  id: string;
  total: number;
  paidAt: Date | null;
  clientId: string | null;
  status: string;
  lines: { description: string; lineTotal: number }[];
}

interface ExpenseRow {
  id: string;
  amount: number;
  date: Date;
  categoryId: string;
  costCenterId: string | null;
  categoryName: string;
  costCenterName: string | null;
}

async function fetchPaidInvoices(
  tenantId: string,
  from: Date,
  to: Date
): Promise<InvoiceRow[]> {
  // Some auto-invoiced rows lack `paidAt` (paid via Redsys → webhook may have
  // missed). Fall back to `issuedAt` so genuine paid invoices still count.
  const rows = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: "paid",
      OR: [
        { paidAt: { gte: from, lte: to } },
        { paidAt: null, issuedAt: { gte: from, lte: to } },
      ],
    },
    select: {
      id: true,
      total: true,
      paidAt: true,
      issuedAt: true,
      clientId: true,
      status: true,
      lines: { select: { description: true, lineTotal: true } },
    },
  });
  return rows.map((r) => ({ ...r, paidAt: r.paidAt ?? r.issuedAt }));
}

async function fetchExpenses(
  tenantId: string,
  from: Date,
  to: Date
): Promise<ExpenseRow[]> {
  const rows = await prisma.expense.findMany({
    where: { tenantId, date: { gte: from, lte: to } },
    select: {
      id: true,
      amount: true,
      date: true,
      categoryId: true,
      costCenterId: true,
      category: { select: { name: true } },
      costCenter: { select: { name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    date: r.date,
    categoryId: r.categoryId,
    costCenterId: r.costCenterId,
    categoryName: r.category.name,
    costCenterName: r.costCenter?.name ?? null,
  }));
}

function buildRevenueGroups(
  invoices: InvoiceRow[],
  groupBy: GroupBy,
  total: number
) {
  const map = new Map<string, number>();
  for (const inv of invoices) {
    const key = getRevenueKey(inv, groupBy);
    map.set(key, (map.get(key) ?? 0) + inv.total);
  }
  return mapToArray(map, total);
}

function getRevenueKey(inv: InvoiceRow, groupBy: GroupBy): string {
  switch (groupBy) {
    case "month":
      return inv.paidAt
        ? `${inv.paidAt.getFullYear()}-${String(inv.paidAt.getMonth() + 1).padStart(2, "0")}`
        : "Sin fecha";
    case "channel":
      return inv.clientId ? "Con cliente" : "Sin cliente";
    case "product":
      return inv.lines.length > 0
        ? inv.lines[0].description.slice(0, 50)
        : "Sin detalle";
    case "category":
      return inv.lines.length > 0
        ? inv.lines[0].description.split(" ")[0]
        : "Sin categoria";
    case "costCenter":
      return "Ingresos";
    default:
      return "Otros";
  }
}

function buildExpenseGroups(
  expenses: ExpenseRow[],
  groupBy: GroupBy,
  total: number
) {
  const map = new Map<string, number>();
  for (const exp of expenses) {
    const key = getExpenseKey(exp, groupBy);
    map.set(key, (map.get(key) ?? 0) + exp.amount);
  }
  return mapToArray(map, total);
}

function getExpenseKey(exp: ExpenseRow, groupBy: GroupBy): string {
  switch (groupBy) {
    case "month":
      return `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, "0")}`;
    case "category":
      return exp.categoryName;
    case "costCenter":
      return exp.costCenterName ?? "Sin centro de coste";
    case "channel":
      return exp.categoryName;
    case "product":
      return exp.categoryName;
    default:
      return "Otros";
  }
}

function buildMonthlyTrend(
  invoices: InvoiceRow[],
  expenses: ExpenseRow[],
  from: Date,
  to: Date
) {
  const months = new Map<string, { revenue: number; expenses: number }>();
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    months.set(key, { revenue: 0, expenses: 0 });
    cur.setMonth(cur.getMonth() + 1);
  }

  for (const inv of invoices) {
    if (!inv.paidAt) continue;
    const key = `${inv.paidAt.getFullYear()}-${String(inv.paidAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = months.get(key);
    if (entry) entry.revenue += inv.total;
  }

  for (const exp of expenses) {
    const key = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = months.get(key);
    if (entry) entry.expenses += exp.amount;
  }

  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: round2(data.revenue),
      expenses: round2(data.expenses),
      profit: round2(data.revenue - data.expenses),
    }));
}

function mapToArray(map: Map<string, number>, total: number) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount]) => ({
      label,
      amount: round2(amount),
      percentage: total > 0 ? round2((amount / total) * 100) : 0,
    }));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
