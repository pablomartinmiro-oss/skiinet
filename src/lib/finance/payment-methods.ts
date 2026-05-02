export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Tarjeta",
  cash: "Efectivo",
  bizum: "Bizum",
  transfer: "Transferencia",
  redsys: "Redsys (TPV)",
  mixed: "Mixto",
  other: "Otro",
};

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
