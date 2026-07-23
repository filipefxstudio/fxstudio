import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DashboardImoveisAprovacaoAlertProps {
  count: number;
}

export function DashboardImoveisAprovacaoAlert({
  count,
}: DashboardImoveisAprovacaoAlertProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium text-amber-900">
            {count} {count === 1 ? "imóvel" : "imóveis"} aguardando aprovação
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Revise os cadastros pendentes antes de publicar no site e portais.
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className="border-amber-300 bg-white">
        <Link href="/dashboard/imoveis?status=aguardando_aprovacao">Ver imóveis</Link>
      </Button>
    </div>
  );
}
