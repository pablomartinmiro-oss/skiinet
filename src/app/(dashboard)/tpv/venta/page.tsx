"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import {
  useSessions,
  useCreateSale,
  type PaymentMethods,
} from "@/hooks/useTpv";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import ProductGrid from "./_components/ProductGrid";
import Cart, { type CartItem } from "./_components/Cart";
import PaymentBar from "./_components/PaymentBar";
import PaymentModal from "./_components/PaymentModal";
import Receipt from "./_components/Receipt";
import { TPV_CATEGORIES, type TpvTabKey } from "./_components/categories";

type CompletedSale = {
  ticketNumber: string;
  date: string;
  totalAmount: number;
  totalTax: number;
  paymentMethods: PaymentMethods;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export default function TpvVentaPage() {
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: sessData, isLoading: loadingSessions } = useSessions(
    undefined,
    "open"
  );
  const createSale = useCreateSale();

  const [activeTab, setActiveTab] = useState<TpvTabKey>("alquiler");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [completed, setCompleted] = useState<CompletedSale | null>(null);

  const openSessions = sessData?.sessions ?? [];
  const activeSessionId =
    selectedSessionId ||
    (openSessions.length === 1 ? openSessions[0].id : "");
  const activeSession = openSessions.find((s) => s.id === activeSessionId);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const cats = TPV_CATEGORIES[activeTab].categories;
    const sorted = products
      .filter((p) => p.isActive && cats.includes(p.category))
      .sort((a, b) => {
        if (b.isPresentialSale !== a.isPresentialSale) return Number(b.isPresentialSale) - Number(a.isPresentialSale);
        return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
      });
    const seen = new Set<string>();
    return sorted.filter((p) => {
      const key = `${p.name}|${p.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [products, activeTab]);

  const total = useMemo(
    () => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [cart]
  );

  const addToCart = (productId: string, name: string, unitPrice: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        { productId, description: name, quantity: 1, unitPrice },
      ];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l))
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  const handleCharge = async (paymentMethods: PaymentMethods) => {
    if (!activeSession) {
      toast.error("Selecciona una sesión de caja");
      return;
    }
    if (cart.length === 0) {
      toast.error("El carrito esta vacio");
      return;
    }
    try {
      const result = await createSale.mutateAsync({
        sessionId: activeSession.id,
        paymentMethods,
        items: cart.map((l) => ({
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      const sale = result.sale;
      setCompleted({
        ticketNumber: sale.ticketNumber,
        date: sale.date,
        totalAmount: sale.totalAmount,
        totalTax: sale.totalTax,
        paymentMethods,
        items: cart.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.unitPrice * l.quantity,
        })),
      });
      setPaymentOpen(false);
      setCart([]);
      toast.success(`Ticket ${sale.ticketNumber} cobrado`);
    } catch {
      toast.error("Error al cobrar");
    }
  };

  if (loadingProducts || loadingSessions) return <PageSkeleton />;

  if (openSessions.length === 0) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center">
        <div className="rounded-2xl bg-white p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)] max-w-md">
          <Lock className="mx-auto mb-3 h-10 w-10 text-[#8A8580]" />
          <h2 className="mb-2 text-lg font-semibold text-[#2D2A26]">
            No hay sesiones abiertas
          </h2>
          <p className="mb-6 text-sm text-[#8A8580]">
            Abre una sesión de caja antes de empezar a vender.
          </p>
          <Link
            href="/tpv?tab=sessions"
            className="inline-flex rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors"
          >
            Ir a sesiones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/tpv"
            className="flex items-center gap-1.5 rounded-[10px] border border-[#E8E4DE] bg-white px-3 py-1.5 text-sm text-[#8A8580] hover:text-[#2D2A26] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Backoffice
          </Link>
          <h1 className="text-xl font-bold text-[#2D2A26]">Punto de Venta</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8A8580]">Caja:</span>
          {openSessions.length === 1 ? (
            <span className="rounded-[10px] bg-[#FAF9F7] px-3 py-1.5 text-sm font-medium text-[#2D2A26]">
              {openSessions[0].register?.name}
            </span>
          ) : (
            <select
              value={activeSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="rounded-[10px] border border-[#E8E4DE] px-3 py-1.5 text-sm focus:border-[#E87B5A] focus:outline-none"
            >
              <option value="">Selecciona caja</option>
              {openSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.register?.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[7fr_3fr]">
        <ProductGrid
          activeTab={activeTab}
          onTabChange={setActiveTab}
          products={filteredProducts}
          onAdd={addToCart}
        />
        <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <Cart
            items={cart}
            onUpdateQty={updateQty}
            onRemove={removeItem}
            onClear={() => setCart([])}
          />
          <PaymentBar
            total={total}
            disabled={cart.length === 0 || !activeSession}
            onCharge={() => setPaymentOpen(true)}
          />
        </div>
      </div>

      {paymentOpen && (
        <PaymentModal
          total={total}
          onClose={() => setPaymentOpen(false)}
          onConfirm={handleCharge}
          submitting={createSale.isPending}
        />
      )}

      {completed && (
        <Receipt sale={completed} onClose={() => setCompleted(null)} />
      )}
    </div>
  );
}
