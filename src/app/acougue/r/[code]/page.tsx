import { notFound, redirect } from "next/navigation";
import { findReservation } from "@/lib/acougue/store";

export const dynamic = "force-dynamic";

export default async function LegacyReservationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const found = await findReservation(code);
  if (!found) notFound();
  redirect(`/acougue/${found.shop.slug}/r/${found.reservation.code}`);
}
