type Variant = 'horizontal' | 'vertical' | 'isotipo' | 'logotipo';

/** Muestra el logo positivo en Claro y el negativo en Oscuro/Cabina, sin JavaScript. */
export default function Logo({ variant = 'horizontal', className = 'h-8' }: { variant?: Variant; className?: string }) {
  return (
    <>
      <img src={`/logo/kongre_${variant}_positivo.svg`} alt="Kongre" className={`${className} block dark:hidden`} />
      <img src={`/logo/kongre_${variant}_negativo.svg`} alt="Kongre" className={`${className} hidden dark:block`} />
    </>
  );
}
