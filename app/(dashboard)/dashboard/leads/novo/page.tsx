import { redirect } from "next/navigation";

export default function NovoLeadRedirectPage() {
  redirect("/dashboard/atendimentos/novo");
}
