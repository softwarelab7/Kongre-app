import {
  CalendarDays, MapPin, ShieldCheck, Wifi, Building2, CircleUserRound, KeyRound,
  Eye, Sparkles, ArrowRight, Sun, Moon, MonitorSpeaker, type LucideIcon,
} from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import AnimIcon, { usePlay, type Motion } from './AnimIcon';
import { useTheme, type Theme } from './theme';

const NEXT: Record<Theme, Theme> = { light: 'dark', dark: 'cabina', cabina: 'light' };
const NAME: Record<Theme, string> = { light: 'Claro', dark: 'Oscuro', cabina: 'Cabina A/V' };
const THEME_ICON: Record<Theme, LucideIcon> = { light: Sun, dark: Moon, cabina: MonitorSpeaker };

const FEATURES: { icon: LucideIcon; motion: Motion; title: string; text: string }[] = [
  { icon: CalendarDays, motion: 'tilt', title: 'Reuniones & Guía S-89', text: 'Programación Vida y Ministerio, Fin de Semana, generación automática e impresión de hojas S-89 oficiales.' },
  { icon: MapPin, motion: 'drop', title: 'Territorios & Carritos', text: 'Manzanas georreferenciadas, enlaces digitales por QR para publicadores y control de turnos en carritos.' },
  { icon: ShieldCheck, motion: 'pulse', title: 'Seguridad por Roles & PIN', text: 'Autenticación con ID de congregación, PIN de congregación y PIN personal bajo estrictas directrices.' },
  { icon: Wifi, motion: 'flash', title: 'PWA & Modo Offline', text: 'Úsala en el Salón sin conexión a internet; tus datos se sincronizan al volver a tener red.' },
];

function Feature({ icon, motion, title, text, delay }: (typeof FEATURES)[number] & { delay: number }) {
  const [n, bump] = usePlay();
  return (
    <article onMouseEnter={bump} className="border-t border-line pb-5 pt-5">
      <AnimIcon icon={icon} motion={motion} delay={delay} play={n} />
      <h3 className="mb-1.5 mt-3 text-base font-bold">{title}</h3>
      <p className="text-[13.5px] leading-relaxed text-muted">{text}</p>
    </article>
  );
}

type OptionProps = {
  icon: LucideIcon; motion: Motion; delay: number; title: string; text: string;
  pill?: { label: string; tone: 'of' | 'ok' }; main?: boolean; onClick?: () => void;
};

function Option({ icon, motion, delay, title, text, pill, main, onClick }: OptionProps) {
  const [n, bump] = usePlay();
  return (
    <button
      type="button"
      onMouseEnter={bump}
      onFocus={bump}
      onClick={() => { bump(); onClick?.(); }}
      className={`group mb-2 flex w-full cursor-pointer items-start gap-4 rounded-2xl border-[1.5px] p-4 text-left transition-colors ${
        main ? 'border-bline bg-brand-soft hover:border-brand' : 'border-transparent hover:bg-hover'
      }`}
    >
      <span className="mt-0.5"><AnimIcon icon={icon} motion={motion} delay={delay} play={n} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <b className="text-[15.5px] font-bold">{title}</b>
          {pill && (
            <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${pill.tone === 'of' ? 'bg-ofb text-off' : 'bg-okb text-okf'}`}>
              {pill.label}
            </span>
          )}
        </span>
        <span className="mt-1 block text-[13px] leading-normal text-muted">{text}</span>
      </span>
      <ArrowRight size={20} className="mt-0.5 text-muted transition-all group-hover:translate-x-1 group-hover:text-brand" aria-hidden />
    </button>
  );
}

type Props = { onRegistrar?: () => void; onGoogle?: () => void; onConectar?: () => void; onInvitado?: () => void };

export default function Bienvenida({ onRegistrar, onGoogle, onConectar, onInvitado }: Props) {
  const { theme, setTheme } = useTheme();
  const ThemeIcon = THEME_ICON[theme];
  const next = NEXT[theme];
  const [nb, bumpBadge] = usePlay();

  return (
    <div className="flex min-h-screen flex-col bg-page text-ink">
      <header className="flex items-center justify-between border-b border-line bg-card px-4 py-3.5 md:px-8">
        <AnimatedLogo />
        <button
          type="button"
          onClick={() => setTheme(next)}
          title={`Tema: ${NAME[theme]} (cambiar a ${NAME[next]})`}
          aria-label={`Tema: ${NAME[theme]}. Cambiar a ${NAME[next]}`}
          className="grid size-10 cursor-pointer place-items-center rounded-full bg-brand-soft text-brand"
        >
          <ThemeIcon size={20} aria-hidden />
        </button>
      </header>

      <main className="mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-10 px-4 py-8 md:px-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-16 lg:py-16">
        <section>
          <button type="button" onClick={bumpBadge} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-bline bg-brand-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-brand">
            <AnimIcon icon={Sparkles} motion="pulse" delay={0.2} size={16} play={nb} />
            Gestor Teocrático Integral • Seguro y Eficiente
          </button>
          <h1 className="mb-4 mt-5 text-[clamp(34px,4.4vw,58px)] font-extrabold leading-[1.06] tracking-tight">
            Toda la gestión teocrática de tu congregación,{' '}
            <em className="bg-linear-to-r from-(--t1) to-(--t2) bg-clip-text not-italic text-transparent">en un solo lugar.</em>
          </h1>
          <p className="max-w-[560px] text-[16.5px] leading-relaxed text-muted">
            Plataforma digital especializada para coordinadores, secretarios, superintendentes de servicio y publicadores. Organiza programas semanales, hojas S-89, asignaciones de limpieza y territorios con soporte offline PWA.
          </p>
          <div className="mt-9 grid gap-x-8 sm:grid-cols-2">
            {FEATURES.map((f, i) => <Feature key={f.title} {...f} delay={0.5 + i * 0.15} />)}
          </div>
        </section>

        <section aria-label="Portal de acceso" className="rounded-[28px] border border-line bg-card p-7" style={{ boxShadow: 'var(--card-shadow)' }}>
          <div className="flex items-center justify-between text-[11.5px] font-bold tracking-wider text-brand">
            <span>KONGRE • PORTAL DE ACCESO</span>
            <span className="rounded-full bg-hover px-2.5 py-0.5 font-semibold tracking-normal text-muted">Gestor Teocrático</span>
          </div>
          <h2 className="mb-1 mt-3.5 text-[26px] font-extrabold tracking-tight">¡Bienvenido a Kongre!</h2>
          <p className="mb-4 text-[13.5px] leading-normal text-muted">Una herramienta teocrática que facilita la gestión integral de la congregación</p>
          <Option main icon={Building2} motion="rise" delay={0.9} pill={{ label: 'Oficial', tone: 'of' }} onClick={onRegistrar}
            title="Registrar mi Congregación" text="Configura tu congregación desde cero: ID, PIN de Congregación, PIN Personal, circuito y horarios." />
          <Option icon={CircleUserRound} motion="pulse" delay={1.05} onClick={onGoogle}
            title="Iniciar sesión con Google" text="Accede con tu cuenta verificada para sincronizar asignaciones y acceder a tu perfil." />
          <Option icon={KeyRound} motion="wiggle" delay={1.2} onClick={onConectar}
            title="Conectar con ID y PIN de Congregación" text="Accede a una congregación existente con su ID y PIN o código de invitación." />
          <Option icon={Eye} motion="blink" delay={1.3} onClick={onInvitado}
            title="Iniciar sesión con código de invitación" text="Accede con un código de un solo uso en este dispositivo." />
        </section>
      </main>

      <footer className="px-4 pb-7 pt-5 text-center text-[13px] text-muted">
        Más información sobre nuestros{' '}
        <a href="/terminos" className="font-semibold text-brand hover:underline">Términos de Uso</a> y{' '}
        <a href="/privacidad" className="font-semibold text-brand hover:underline">Política de Privacidad</a>.
      </footer>
    </div>
  );
}
