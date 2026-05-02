"use client";

import { X } from "lucide-react";
import type { Supplier } from "@/hooks/useSuppliers";

const iCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] placeholder:text-[#8A8580] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";
const sCls =
  "w-full rounded-[10px] border border-[#E8E4DE] px-3 py-2 text-sm text-[#2D2A26] focus:border-[#E87B5A] focus:outline-none focus:ring-1 focus:ring-[#E87B5A]";
const lCls = "block text-sm font-medium text-[#2D2A26] mb-1";

export interface SupplierFormData {
  fiscalName: string;
  commercialName: string;
  nif: string;
  iban: string;
  email: string;
  phone: string;
  commissionPercentage: number;
  commissionType: string;
  fixedCostPerUnit: number;
  marginPercentage: number;
  paymentMethod: string;
  settlementFrequency: string;
  status: string;
}

export const emptyForm: SupplierFormData = {
  fiscalName: "", commercialName: "", nif: "", iban: "", email: "", phone: "",
  commissionPercentage: 0, commissionType: "percentage",
  fixedCostPerUnit: 0, marginPercentage: 0,
  paymentMethod: "transfer", settlementFrequency: "monthly", status: "active",
};

export function fromSupplier(s: Supplier): SupplierFormData {
  return {
    fiscalName: s.fiscalName, commercialName: s.commercialName ?? "",
    nif: s.nif, iban: s.iban ?? "", email: s.email ?? "", phone: s.phone ?? "",
    commissionPercentage: s.commissionPercentage,
    commissionType: s.commissionType ?? "percentage",
    fixedCostPerUnit: s.fixedCostPerUnit ?? 0,
    marginPercentage: s.marginPercentage ?? 0,
    paymentMethod: s.paymentMethod,
    settlementFrequency: s.settlementFrequency, status: s.status,
  };
}

type SetForm = React.Dispatch<React.SetStateAction<SupplierFormData>>;

function TxtField({ label, field, form, setForm, placeholder, required, type = "text" }: {
  label: string; field: keyof SupplierFormData; form: SupplierFormData;
  setForm: SetForm; placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className={lCls}>{label}</label>
      <input type={type} value={form[field] as string}
        onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
        className={iCls} placeholder={placeholder} required={required} />
    </div>
  );
}

function NumField({ label, field, form, setForm, min = 0, max, step = "0.01" }: {
  label: string; field: keyof SupplierFormData; form: SupplierFormData;
  setForm: SetForm; min?: number; max?: number; step?: string;
}) {
  return (
    <div>
      <label className={lCls}>{label}</label>
      <input type="number" min={min} max={max} step={step}
        value={form[field] as number}
        onChange={(e) => setForm((p) => ({ ...p, [field]: parseFloat(e.target.value) || 0 }))}
        className={iCls} />
    </div>
  );
}

interface Props {
  editing: Supplier | null;
  form: SupplierFormData;
  setForm: SetForm;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export default function SupplierFormModal({ editing, form, setForm, onClose, onSave }: Props) {
  const ct = form.commissionType;
  const showPct = ct === "percentage" || ct === "hybrid";
  const showFixed = ct === "fixed" || ct === "hybrid";
  const showMargin = ct === "margin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">
            {editing ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h2>
          <button onClick={onClose}
            className="rounded-[10px] p-1.5 text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSave} className="space-y-4 p-6">
          <TxtField label="Nombre fiscal *" field="fiscalName" form={form}
            setForm={setForm} placeholder="Ej: Empresa Servicios S.L." required />
          <TxtField label="Nombre comercial" field="commercialName" form={form}
            setForm={setForm} placeholder="Nombre comercial (opcional)" />
          <div className="grid grid-cols-2 gap-4">
            <TxtField label="NIF *" field="nif" form={form} setForm={setForm}
              placeholder="B12345678" required />
            <TxtField label="IBAN" field="iban" form={form} setForm={setForm}
              placeholder="ES00 0000 0000 0000 0000 0000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TxtField label="Email" field="email" form={form} setForm={setForm}
              placeholder="contacto@empresa.com" type="email" />
            <TxtField label="Teléfono" field="phone" form={form} setForm={setForm}
              placeholder="+34 600 000 000" />
          </div>
          {/* Commission type */}
          <div>
            <label className={lCls}>Tipo de comision</label>
            <select value={form.commissionType}
              onChange={(e) => setForm((p) => ({ ...p, commissionType: e.target.value }))}
              className={sCls}>
              <option value="percentage">Porcentaje</option>
              <option value="fixed">Coste fijo por pax</option>
              <option value="margin">Margen</option>
              <option value="hybrid">Hibrido (fijo + porcentaje)</option>
            </select>
          </div>
          {/* Conditional commission fields */}
          <div className="grid grid-cols-2 gap-4">
            {showPct && <NumField label="Comision %" field="commissionPercentage"
              form={form} setForm={setForm} max={100} />}
            {showFixed && <NumField label="Coste fijo/pax (EUR)" field="fixedCostPerUnit"
              form={form} setForm={setForm} />}
            {showMargin && <NumField label="Margen %" field="marginPercentage"
              form={form} setForm={setForm} max={100} />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lCls}>Método pago</label>
              <select value={form.paymentMethod}
                onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                className={sCls}>
                <option value="transfer">Transferencia</option>
                <option value="card">Tarjeta</option>
              </select>
            </div>
            <div>
              <label className={lCls}>Frecuencia</label>
              <select value={form.settlementFrequency}
                onChange={(e) => setForm((p) => ({ ...p, settlementFrequency: e.target.value }))}
                className={sCls}>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
              </select>
            </div>
          </div>
          <div>
            <label className={lCls}>Estado</label>
            <select value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className={sCls}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-[10px] border border-[#E8E4DE] px-4 py-2 text-sm font-medium text-[#8A8580] hover:bg-[#FAF9F7] transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="rounded-[10px] bg-[#E87B5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#D56E4F] transition-colors">
              {editing ? "Guardar Cambios" : "Crear Proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
