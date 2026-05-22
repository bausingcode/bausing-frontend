import type { CardType } from "@/lib/api";

export type SelectedCardInstallment = {
  cuotas: number;
  recargoPorcentaje: number;
};

export type CardPaymentDetailsPayload = {
  card_type_code: string;
  card_type_name: string;
  bank_name: string;
  installments: number;
  surcharge_percent: number;
};

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
