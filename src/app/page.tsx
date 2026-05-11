import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function RootPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  switch (session.role) {
    case "ADMIN": redirect("/admin");
    case "BOOKER": redirect("/booker");
    default: redirect("/installer");
  }
}
