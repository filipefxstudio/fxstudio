import { HeroLarImoveis } from "@/components/site/HeroLarImoveis";
import { ImoveisDestaqueSection } from "@/components/site/ImoveisDestaqueSection";
import { getBairrosPublicos, getImoveisDestaquePublicos } from "@/lib/site/queries";
import type { Corretor } from "@/types";

interface SiteHomeContentProps {
  corretor: Corretor;
}

export async function SiteHomeContent({ corretor }: SiteHomeContentProps) {
  const [imoveis, bairros] = await Promise.all([
    getImoveisDestaquePublicos(corretor.id),
    getBairrosPublicos(corretor.id),
  ]);

  return (
    <>
      <HeroLarImoveis corretor={corretor} bairros={bairros} />
      <ImoveisDestaqueSection imoveis={imoveis} />
    </>
  );
}
