import { cookies } from "next/headers";
import DistribucionInicioClient from "./DistribucionInicioClient";

export default async function DistribucionInicio() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  return <DistribucionInicioClient />;
}
