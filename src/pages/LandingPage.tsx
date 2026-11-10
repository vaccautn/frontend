import { VaccaIsotipo } from "@/components/ui/VaccaIsotipo";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowDown,
  IconArrowRight,
  IconCalendarHeart,
  IconCheck,
  IconClipboardList,
  IconMap2,
  IconUsers,
  IconDeviceMobile,
  IconScan,
} from "@tabler/icons-react";
import { useAuth } from "@/features/auth";
import { LandingCapturas } from "@/features/landing/LandingCapturas";
import { releases } from "@/features/landing/releases";
import "@/features/landing/landing.css";

const funciones = [
  {
    icono: IconClipboardList,
    titulo: "Tu rodeo ordenado",
    texto:
      "Caravanas, lotes y categorías. Cargá desde una planilla o una tabla y encontrá cada animal cuando lo necesites.",
  },
  {
    icono: IconMap2,
    titulo: "El campo en contexto",
    texto:
      "Consultá los potreros en el mapa y revisá sus animales y su condición corporal desde el mismo lugar.",
  },
  {
    icono: IconCalendarHeart,
    titulo: "El seguimiento completo",
    texto:
      "Evaluaciones con fotos o video, servicios, crías y recordatorios de manejo, vinculados a la historia de cada animal.",
  },
  {
    icono: IconUsers,
    titulo: "El trabajo compartido",
    texto:
      "Sumá colaboradores al campo y consultá en el historial quién realizó cada carga o movimiento.",
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const destinoApp = isAuthenticated ? "/inicio" : "/login";
  const textoApp = isAuthenticated ? "Abrir mi campo" : "Ingresar a VACCA";
  useEffect(() => {
    const anterior = document.title;
    document.title = "VACCA · El estado de tu rodeo, a la vista";
    return () => {
      document.title = anterior;
    };
  }, []);

  return (
    <div className="landing" id="inicio">
      <a className="landing-skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <a
            href="#inicio"
            className="landing-brand"
            aria-label="VACCA, inicio"
          >
            <VaccaIsotipo size={36} />
            <span>
              vacca<span className="landing-brand-note">gestión bovina</span>
            </span>
          </a>
          <nav className="landing-nav-links" aria-label="Secciones">
            <a href="#pantallas">La aplicación</a>
            <a href="#funciones">Funciones</a>
            <a href="#proyecto">El proyecto</a>
          </nav>
          <Link
            to={destinoApp}
            className="landing-btn landing-btn-primary landing-btn-sm"
          >
            {isAuthenticated ? "Ir a la app" : "Ingresar"}
            <IconArrowRight size={16} />
          </Link>
        </div>
      </header>
      <main id="contenido">
        <section className="landing-hero">
          <div className="landing-container landing-hero-inner">
            <div className="landing-hero-text">
              <p className="landing-eyebrow">
                <span /> Gestión de rodeos de cría
              </p>
              <h1>
                El estado de tu rodeo, <span>a la vista.</span>
              </h1>
              <p className="landing-lead">
                Conocé cómo están tus animales y seguí su evolución. VACCA reúne
                el campo, las evaluaciones y el manejo del rodeo en un solo
                lugar.
              </p>
              <div className="landing-hero-actions">
                <Link
                  to={destinoApp}
                  className="landing-btn landing-btn-primary"
                >
                  {textoApp}
                  <IconArrowRight size={18} />
                </Link>
                <a href="#pantallas" className="landing-btn landing-btn-ghost">
                  Conocer la aplicación
                  <IconArrowDown size={17} />
                </a>
              </div>
              <p className="landing-hero-footnote">
                Para trabajar con información a mano, en la computadora y en el
                celular.
              </p>
            </div>
            <figure className="landing-hero-product">
              <div className="landing-product-frame">
                <div className="landing-frame-bar">
                  <span className="landing-frame-brand">
                    <VaccaIsotipo size={18} /> VACCA <span>/ Inicio</span>
                  </span>
                  <span className="landing-frame-label">
                    Vista de la aplicación
                  </span>
                </div>
                <a
                  href="#pantallas"
                  aria-label="Explorar las capturas de VACCA"
                >
                  <img
                    src="/landing/inicio.jpg"
                    alt="Captura real del tablero de VACCA con el resumen del rodeo, su distribución y evolución de condición corporal."
                    width={1440}
                    height={960}
                    fetchPriority="high"
                    decoding="async"
                  />
                </a>
              </div>
              <figcaption>
                <span className="landing-live-dot" /> Así se ve VACCA · datos de
                demostración
              </figcaption>
            </figure>
          </div>
        </section>
        <section
          className="landing-workflow"
          aria-label="Del registro al seguimiento"
        >
          <div className="landing-container landing-workflow-inner">
            {[
              ["01", "Organizá", "Cargá tus animales y lotes."],
              [
                "02",
                "Evaluá",
                "Registrá la condición corporal con fotos o video.",
              ],
              [
                "03",
                "Hacé seguimiento",
                "Revisá el estado y las medidas de manejo.",
              ],
            ].map(([numero, titulo, texto]) => (
              <div className="landing-step" key={numero}>
                <span>{numero}</span>
                <div>
                  <h2>{titulo}</h2>
                  <p>{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section id="pantallas" className="landing-section landing-showcase">
          <div className="landing-container">
            <div className="landing-section-head">
              <p className="landing-eyebrow">Por dentro</p>
              <h2>Una mirada a la aplicación.</h2>
              <p>
                Del panorama general a la historia de cada animal. Elegí una
                pantalla para recorrer VACCA.
              </p>
            </div>
            <LandingCapturas />
          </div>
        </section>
        <section id="funciones" className="landing-section landing-section-alt">
          <div className="landing-container">
            <div className="landing-section-head">
              <p className="landing-eyebrow">El trabajo de todos los días</p>
              <h2>Todo conectado con tu rodeo.</h2>
              <p>
                Los registros de cada jornada se convierten en información para
                seguir el campo a lo largo del tiempo.
              </p>
            </div>
            <div className="landing-feature-grid">
              {funciones.map(({ icono: Icono, titulo, texto }) => (
                <article className="landing-feature" key={titulo}>
                  <div className="landing-feature-icon">
                    <Icono size={25} stroke={1.5} />
                  </div>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="landing-section landing-mobile">
          <div className="landing-container landing-mobile-inner">
            <div className="landing-mobile-copy">
              <p className="landing-eyebrow">
                <IconDeviceMobile size={18} /> También en el celular
              </p>
              <h2>La misma información, donde estés.</h2>
              <p>
                Consultá el resumen del rodeo o abrí la ficha de un animal desde
                el navegador de tu celular, sin instalar otra aplicación.
              </p>
              <ul className="landing-check-list">
                <li>
                  <IconCheck size={18} /> Accedé con tu cuenta.
                </li>
                <li>
                  <IconCheck size={18} /> Consultá evaluaciones e historial.
                </li>
                <li>
                  <IconCheck size={18} /> Trabajá sobre el mismo campo que tu
                  equipo.
                </li>
              </ul>
              <p className="landing-demo-note">
                El acceso y la carga de datos requieren conexión a internet.
              </p>
            </div>
            <div
              className="landing-phones"
              aria-label="Capturas de VACCA en celular"
            >
              <figure className="landing-phone">
                <img
                  src="/landing/inicio-movil.jpg"
                  alt="Inicio de VACCA en una pantalla de celular con los indicadores del rodeo."
                  width={390}
                  height={844}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>Inicio</figcaption>
              </figure>
              <figure className="landing-phone landing-phone-second">
                <img
                  src="/landing/animal-movil.jpg"
                  alt="Ficha de un animal de demostración en un celular, con foto y servicios."
                  width={390}
                  height={844}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>Ficha del animal</figcaption>
              </figure>
            </div>
          </div>
        </section>
        <section id="ia" className="landing-section landing-ia">
          <div className="landing-container landing-ia-inner">
            <div className="landing-ia-icon">
              <IconScan size={40} stroke={1.4} />
            </div>
            <div>
              <p className="landing-eyebrow">Análisis visual</p>
              <h2>
                Una ayuda para registrar. Un criterio que sigue siendo tuyo.
              </h2>
              <p>
                VACCA integra detección de bovinos en fotos y videos para
                acompañar el registro de evaluaciones. La estimación automática
                de condición corporal está en etapa experimental y requiere
                revisión.
              </p>
            </div>
            <span className="landing-status">CC automática experimental</span>
          </div>
        </section>
        <section id="proyecto" className="landing-section">
          <div className="landing-container landing-project">
            <div>
              <p className="landing-eyebrow">El proyecto</p>
              <h2>Tecnología pensada para el manejo del rodeo.</h2>
              <p>
                VACCA es un proyecto final de Ingeniería en Sistemas de
                Información: un sistema de soporte de decisiones para el manejo
                nutricional de rodeos de cría.
              </p>
              <p>
                Reúne la gestión de animales, las evaluaciones de condición
                corporal y el mapa del campo para sostener el seguimiento entre
                jornadas.
              </p>
              <div
                className="landing-stack"
                aria-label="Tecnologías del proyecto"
              >
                <span>React</span>
                <span>FastAPI</span>
                <span>PostgreSQL</span>
                <span>OpenLayers</span>
                <span>Visión por computadora</span>
              </div>
            </div>
            <div className="landing-evolution">
              <h3>Cómo fue creciendo</h3>
              <p>
                Desde los primeros registros hasta la carga masiva, el análisis
                de video y el trabajo en equipo.
              </p>
              <details>
                <summary>
                  Ver las etapas del proyecto <IconArrowDown size={16} />
                </summary>
                <ol>
                  {releases.map((release) => (
                    <li key={release.id}>
                      <span>
                        {release.etiqueta} · {release.fecha}
                      </span>
                      <h4>{release.titulo}</h4>
                      <p>{release.resumen}</p>
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          </div>
        </section>
        <section className="landing-cta">
          <div className="landing-container landing-cta-inner">
            <div>
              <p className="landing-eyebrow">VACCA · gestión bovina</p>
              <h2>Tu próximo registro empieza acá.</h2>
              <p>Entrá a la aplicación y continuá con tu campo.</p>
            </div>
            <Link to={destinoApp} className="landing-btn landing-btn-primary">
              {textoApp}
              <IconArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <a href="#inicio" className="landing-brand">
            <VaccaIsotipo size={25} />
            <span>vacca</span>
          </a>
          <span>Proyecto final · Ingeniería en Sistemas de Información</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
