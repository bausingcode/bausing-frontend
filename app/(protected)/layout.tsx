import type { Metadata } from "next";
import ProtectedRouteGate from "./ProtectedRouteGate";

export const metadata: Metadata = {
  title: "Cuenta",
  robots: { index: false, follow: false },
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRouteGate>{children}</ProtectedRouteGate>;
}
