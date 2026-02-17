"use client";

import { useLocality } from "@/contexts/LocalityContext";
import SelectAddressModal from "./SelectAddressModal";

export default function LocalityAddressSelector() {
  const {
    requiresAddressSelection,
    availableAddresses,
    selectAddress,
    clearAddressSelection,
  } = useLocality();

  const handleSelect = async (addressId: string) => {
    await selectAddress(addressId);
  };

  const handleClose = () => {
    clearAddressSelection();
    // Si se cierra sin seleccionar, intentar detectar por IP
    // Esto permite que el usuario continúe sin seleccionar dirección
  };

  return (
    <SelectAddressModal
      isOpen={requiresAddressSelection}
      addresses={availableAddresses}
      onSelect={handleSelect}
      onClose={handleClose}
    />
  );
}
