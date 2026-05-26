import type { CardType } from "@/lib/api";

export type SelectedCardInstallment = {
  cuotas: number;
  recargoPorcentaje: number;
};

export type CardInstallmentOption = SelectedCardInstallment & {
  displayOrder?: number;
};

/** Mismo criterio que admin/back: display_order y luego cantidad de cuotas. */
export function sortInstallmentOptions<T extends CardInstallmentOption>(
  options: T[],
): T[] {
  return [...options].sort((a, b) => {
    const orderA = a.displayOrder ?? 0;
    const orderB = b.displayOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.cuotas - b.cuotas;
  });
}

export type CardPaymentDetailsPayload = {
  card_type_code: string;
  card_type_name: string;
  bank_name: string;
  installments: number;
  surcharge_percent: number;
};

/** Monto a abonar incluyendo recargo de financiación en la parte con tarjeta. */
export function computePayableWithInstallmentSurcharge(
  payableSubtotal: number,
  options: {
    hasCardPayment: boolean;
    cardPaymentAmount: number;
    isMultiPayment: boolean;
    installment: SelectedCardInstallment | null;
  },
): number {
  const { hasCardPayment, cardPaymentAmount, isMultiPayment, installment } = options;
  if (!hasCardPayment || !installment || installment.recargoPorcentaje <= 0) {
    return payableSubtotal;
  }
  const cardBase = isMultiPayment ? cardPaymentAmount : payableSubtotal;
  if (cardBase <= 0.01) return payableSubtotal;
  const { totalAmount: cardWithSurcharge } = calculateInstallmentAmounts(cardBase, installment);
  const nonCard = isMultiPayment ? Math.max(0, payableSubtotal - cardBase) : 0;
  return nonCard + cardWithSurcharge;
}

/** Aplica recargo de cuotas al monto base de un método (solo tarjeta). */
export function paymentMethodAmountWithInstallment(
  method: string,
  baseAmount: number,
  installment: SelectedCardInstallment | null,
): number {
  if (method !== "card" || !installment) return baseAmount;
  return calculateInstallmentAmounts(baseAmount, installment).totalAmount;
}

/** Monto total con recargo y valor por cuota (misma fórmula que el checkout). */
export function calculateInstallmentAmounts(
  baseAmount: number,
  installment: Pick<SelectedCardInstallment, "cuotas" | "recargoPorcentaje">,
): { totalAmount: number; cuotaAmount: number } {
  const safeBase = Number.isFinite(baseAmount) && baseAmount > 0 ? baseAmount : 0;
  const recargo =
    Number.isFinite(installment.recargoPorcentaje) && installment.recargoPorcentaje > 0
      ? installment.recargoPorcentaje
      : 0;
  const cuotas =
    Number.isFinite(installment.cuotas) && installment.cuotas > 0 ? installment.cuotas : 1;
  const totalAmount = safeBase * (1 + recargo / 100);
  const cuotaAmount = totalAmount / cuotas;
  return { totalAmount, cuotaAmount };
}

export function formatInstallmentCuotasLabel(cuotas: number): string {
  return cuotas === 1 ? "1 cuota" : `${cuotas} cuotas`;
}

export function formatInstallmentCuotasSelectedLabel(cuotas: number): string {
  const label = formatInstallmentCuotasLabel(cuotas);
  return cuotas === 1 ? `${label} seleccionada` : `${label} seleccionadas`;
}

export function installmentOptionKey(inst: SelectedCardInstallment): string {
  return `${inst.cuotas}:${inst.recargoPorcentaje}`;
}

export function parseInstallmentOptionKey(key: string): SelectedCardInstallment | null {
  const [cuotasStr, recargoStr] = key.split(":");
  const cuotas = Number(cuotasStr);
  const recargoPorcentaje = Number(recargoStr);
  if (!Number.isFinite(cuotas) || cuotas <= 0) return null;
  if (!Number.isFinite(recargoPorcentaje) || recargoPorcentaje < 0) return null;
  return { cuotas, recargoPorcentaje };
}

export function buildCardPaymentObservations(
  cardTypes: CardType[],
  cardTypeCode: string,
  bankName: string,
  installment: SelectedCardInstallment | null,
): string {
  if (!cardTypeCode || !bankName || !installment) return "";
  const cardLabel =
    cardTypes.find((ct) => ct.code === cardTypeCode)?.name || cardTypeCode;
  const cuotaWord = installment.cuotas === 1 ? "cuota" : "cuotas";
  return `Pago con tarjeta: ${cardLabel} | Banco: ${bankName} | ${installment.cuotas} ${cuotaWord}`;
}

export function buildCardPaymentDetailsPayload(
  cardTypes: CardType[],
  cardTypeCode: string,
  bankName: string,
  installment: SelectedCardInstallment | null,
): CardPaymentDetailsPayload | undefined {
  if (!cardTypeCode || !bankName || !installment) return undefined;
  return {
    card_type_code: cardTypeCode,
    card_type_name:
      cardTypes.find((ct) => ct.code === cardTypeCode)?.name || cardTypeCode,
    bank_name: bankName,
    installments: installment.cuotas,
    surcharge_percent: installment.recargoPorcentaje,
  };
}
