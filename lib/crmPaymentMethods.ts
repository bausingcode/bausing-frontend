/** IDs de medios de pago del CRM (formaPagos.medios_pago_id). */

export const CRM_MEDIOS_PAGO_EFECTIVO = 1;
export const CRM_MEDIOS_PAGO_TRANSFERENCIA = 2;
export const CRM_MEDIOS_PAGO_BILLETERA = 3;
export const CRM_MEDIOS_PAGO_TARJETA = 4;

export type CheckoutPaymentMethodSlug = "card" | "cash" | "transfer" | "wallet";

export function crmMediosPagoIdForCheckoutMethod(
  method: CheckoutPaymentMethodSlug | string,
): number {
  switch (method) {
    case "wallet":
      return CRM_MEDIOS_PAGO_BILLETERA;
    case "card":
      return CRM_MEDIOS_PAGO_TARJETA;
    case "transfer":
      return CRM_MEDIOS_PAGO_TRANSFERENCIA;
    default:
      return CRM_MEDIOS_PAGO_EFECTIVO;
  }
}
