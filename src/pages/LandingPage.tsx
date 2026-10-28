import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconCalendarHeart,
  IconCamera,
  IconChartBar,
  IconCheck,
  IconPaw,
  IconMap,
  IconScan,
} from "@tabler/icons-react";
import { useAuth } from "@/features/auth";
import { metricasIA, releases } from "@/features/landing/releases";
import "@/features/landing/landing.css";

const destacados = [
  {
    icono: <IconPaw size={26} stroke={1.5} />,
    titulo: "Rodeo ordenado",
    texto: "Animales, lotes y categorías en un solo lugar, con búsqueda por caravana y filtros.",
  },
  {
    icono: <IconCamera size={26} stroke={1.5} />,
    titulo: "Condición corporal",
    texto: "Sesiones de evaluación en la manga, con fotos y un semáforo que tiene en cuenta el mes.",
  },
  {
    icono: <IconScan size={26} stroke={1.5} />,
    titulo: "IA sobre cada foto",
    texto: "Un modelo propio detecta la vaca y estima su condición corporal a partir de la imagen.",
  },
  {
    icono: <IconCalendarHeart size={26} stroke={1.5} />,
    titulo: "Servicios",
    texto: "Temporada de monta, resultados, nacimientos, reservicio y recomendaciones de manejo.",
  },
  {
    icono: <IconChartBar size={26} stroke={1.5} />,
    titulo: "Tableros",
    texto: "Distribución de CC, evolución y alertas del rodeo, de cada animal y de cada sesión.",
  },
  {
    icono: <IconMap size={26} stroke={1.5} />,
    titulo: "Mapa del campo",
    texto: "Vista satelital con los potreros importados desde KMZ y el estado de cada lote.",
  },
];

const escalaCC = [
  { valor: 1, nombre: "Muy flaca", color: "var(--rojo-alerta)" },
  { valor: 2, nombre: "Flaca", color: "var(--ocre-campo)" },
  { valor: 3, nombre: "Ideal", color: "var(--verde-confirmacion)" },
  { valor: 4, nombre: "Gorda", color: "var(--ambar-aviso)" },
  { valor: 5, nombre: "Muy gorda", color: "var(--rojo-alerta)" },
];

const stack = [
  { capa: "Frontend", detalle: "React · TypeScript · Chakra UI · OpenLayers" },
  { capa: "Backend", detalle: "FastAPI · SQLModel · PostgreSQL · JWT" },
  { capa: "IA", detalle: "YOLO26n fine-tuneado · API de detección" },
  { capa: "Almacenamiento", detalle: "Cloudflare R2 para las fotos" },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const destinoApp = isAuthenticated ? "/rodeo" : "/login";
  const textoApp = isAuthenticated ? "Ir a la app" : "Ingresar";

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <a href="#inicio" className="landing-brand">
            <img src="/vacca_logo.png" alt="" width={36} height={36} />
            <span>Vacca</span>
          </a>
          <nav className="landing-nav-links" aria-label="Secciones">
            <a href="#funciones">Funciones</a>
            <a href="#releases">Releases</a>
            <a href="#ia">IA</a>
            <a href="#tecnologia">Tecnología</a>
          </nav>
          <Link to={destinoApp} className="landing-btn landing-btn-primary landing-btn-sm">
            {textoApp}
          </Link>
        </div>
      </header>

      <main>
        <section id="inicio" className="landing-hero">
          <div className="landing-container landing-hero-inner">
            <div className="landing-hero-text">
              <p className="landing-eyebrow">Proyecto final · Ingeniería en Sistemas de Información</p>
              <h1>La condición corporal de tu rodeo, a la vista.</h1>
              <p className="landing-lead">
                Vacca es un sistema de soporte de decisiones para el manejo nutricional de rodeos de
                cría. Registrá evaluaciones, sacá fotos y dejá que la IA te ayude a decidir a tiempo.
              </p>
              <div className="landing-hero-actions">
                <Link to={destinoApp} className="landing-btn landing-btn-primary">
                  {textoApp} <IconArrowRight size={18} stroke={2} />
                </Link>
                <a href="#releases" className="landing-btn landing-btn-ghost">
                  Ver la evolución
                </a>
              </div>
            </div>

            <div className="landing-hero-card" aria-label="Escala de condición corporal">
              <p className="landing-card-title">Escala de condición corporal</p>
              <ul className="landing-escala">
                {escalaCC.map((nivel) => (
                  <li key={nivel.valor}>
                    <span className="landing-escala-valor" style={{ background: nivel.color }}>
                      {nivel.valor}
                    </span>
                    <span>{nivel.nombre}</span>
                  </li>
                ))}
              </ul>
              <p className="landing-card-note">
                El semáforo cambia según el mes: la misma nota puede ser normal en verano y crítica
                en invierno.
              </p>
            </div>
          </div>
        </section>

        <section id="funciones" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-head">
              <p className="landing-eyebrow">Funciones</p>
              <h2>Todo el ciclo del rodeo de cría</h2>
            </div>
            <div className="landing-grid">
              {destacados.map((item) => (
                <article key={item.titulo} className="landing-feature">
                  <div className="landing-feature-icon">{item.icono}</div>
                  <h3>{item.titulo}</h3>
                  <p>{item.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="releases" className="landing-section landing-section-alt">
          <div className="landing-container">
            <div className="landing-section-head">
              <p className="landing-eyebrow">Releases</p>
              <h2>Cómo fue creciendo Vacca</h2>
              <p className="landing-muted">
                Cada etapa sumó funciones sobre la anterior, de la gestión básica del rodeo al mapa
                del campo.
              </p>
            </div>
            <ol className="landing-timeline">
              {releases.map((release, indice) => (
                <li key={release.id} className="landing-release">
                  <div className="landing-release-marker" aria-hidden="true">
                    {indice + 1}
                  </div>
                  <div className="landing-release-body">
                    <div className="landing-release-meta">
                      <span className="landing-tag">{release.etiqueta}</span>
                      <span className="landing-muted">{release.fecha}</span>
                    </div>
                    <h3>{release.titulo}</h3>
                    <p className="landing-muted">{release.resumen}</p>
                    <ul className="landing-release-list">
                      {release.funciones.map((funcion) => (
                        <li key={funcion}>
                          <IconCheck size={16} stroke={2.2} />
                          <span>{funcion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="ia" className="landing-section landing-ia">
          <div className="landing-container landing-ia-inner">
            <div>
              <p className="landing-eyebrow landing-eyebrow-light">VACCA Vision</p>
              <h2>Un modelo propio que reconoce vacas</h2>
              <p>
                Entrenamos YOLO26n sobre datasets públicos de bovinos. Cada foto que se sube pasa
                primero por el modelo: si no hay una vaca, se rechaza y se avisa el motivo.
              </p>
            </div>
            <div className="landing-metricas">
              {metricasIA.map((metrica) => (
                <div key={metrica.etiqueta} className="landing-metrica">
                  <span className="landing-metrica-valor">{metrica.valor}</span>
                  <span className="landing-metrica-etiqueta">{metrica.etiqueta}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tecnologia" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-head">
              <p className="landing-eyebrow">Tecnología</p>
              <h2>Cómo está construido</h2>
            </div>
            <div className="landing-stack">
              {stack.map((item) => (
                <div key={item.capa} className="landing-stack-item">
                  <span className="landing-stack-capa">{item.capa}</span>
                  <span className="landing-muted">{item.detalle}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-container landing-cta-inner">
            <h2>Probalo con tu rodeo</h2>
            <Link to={destinoApp} className="landing-btn landing-btn-primary">
              {textoApp} <IconArrowRight size={18} stroke={2} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <span>Vacca · Proyecto final de Ingeniería en Sistemas de Información</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
