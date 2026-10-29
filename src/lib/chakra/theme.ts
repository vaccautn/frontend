import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * Los valores de color acá SIEMPRE referencian las custom properties
 * definidas en src/index.css (paleta VACCA). No agregar hex nuevos:
 * si hace falta un color que no está en index.css, se define ahí primero.
 */
// Los slot recipes de abajo pisan solo algunos estilos. Chakra fusiona el
// array `slots` por posición, así que hay que repetir la lista completa del
// recipe original o se pierden slots (p. ej. el `trigger` del diálogo).
const slotsDe = (recipe: string) =>
  defaultConfig.theme?.slotRecipes?.[recipe]?.slots ?? [];

const CONTROL_OUTLINE = {
  bg: "var(--input-bg)",
  borderColor: "var(--input-border)",
  boxShadow: "var(--shadow-control)",
} as const;

const config = defineConfig({
  cssVarsPrefix: "vacca",
  globalCss: {
    "html, body": {
      fontFamily: "var(--sans)",
      color: "var(--text)",
      background: "var(--bg)",
    },
  },
  theme: {
    tokens: {
      colors: {
        verdeBosque: { value: "var(--verde-bosque)" },
        verdeVacca: { value: "var(--verde-vacca)" },
        verdePastel: { value: "var(--verde-pastel)" },
        ocreCampo: { value: "var(--ocre-campo)" },
        marronCuero: { value: "var(--marron-cuero)" },
        azulAcero: { value: "var(--azul-acero)" },
        grisNiebla: { value: "var(--gris-niebla)" },
        rojoAlerta: { value: "var(--rojo-alerta)" },
        ambarAviso: { value: "var(--ambar-aviso)" },
        verdeConfirmacion: { value: "var(--verde-confirmacion)" },
        rosaHembra: { value: "var(--rosa-hembra)" },
      },
      fonts: {
        heading: { value: "var(--heading)" },
        body: { value: "var(--sans)" },
      },
    },
    // Forma y profundidad: los componentes de Chakra usan la misma escala que
    // el CSS propio (tokens --radius-* y --shadow-* de src/index.css).
    recipes: {
      button: {
        base: {
          borderRadius: "full",
          fontWeight: "semibold",
          transitionProperty: "background, border-color, color, box-shadow, transform",
          transitionDuration: "160ms",
          transitionTimingFunction: "var(--ease-out)",
          _active: { transform: "scale(0.97)" },
        },
        variants: {
          variant: {
            solid: {
              boxShadow:
                "0 1px 2px rgba(23, 38, 28, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.14)",
            },
            outline: {
              bg: "var(--panel)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-control)",
              _hover: { bg: "var(--bg)" },
            },
          },
        },
      },
      badge: {
        base: { borderRadius: "full" },
      },
      // Controles donde se escribe: mismo borde, fondo y sombra que los
      // inputs propios (.field input, filtros).
      input: {
        variants: { variant: { outline: CONTROL_OUTLINE } },
      },
      textarea: {
        variants: { variant: { outline: CONTROL_OUTLINE } },
      },
    },
    slotRecipes: {
      dialog: {
        slots: slotsDe("dialog"),
        base: {
          backdrop: { bg: "var(--backdrop)" },
          content: {
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-overlay)",
          },
        },
      },
      drawer: {
        slots: slotsDe("drawer"),
        base: {
          backdrop: { bg: "var(--backdrop)" },
        },
      },
      menu: {
        slots: slotsDe("menu"),
        base: {
          content: {
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-pop)",
            p: "6px",
          },
          item: { borderRadius: "var(--radius-item)" },
        },
      },
      nativeSelect: {
        slots: slotsDe("nativeSelect"),
        variants: { variant: { outline: { field: CONTROL_OUTLINE } } },
      },
      select: {
        slots: slotsDe("select"),
        variants: { variant: { outline: { trigger: CONTROL_OUTLINE } } },
        base: {
          content: {
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-pop)",
            p: "6px",
          },
          item: { borderRadius: "var(--radius-item)" },
        },
      },
      popover: {
        slots: slotsDe("popover"),
        base: {
          content: {
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-pop)",
          },
        },
      },
      datePicker: {
        slots: slotsDe("datePicker"),
        variants: { variant: { outline: { input: CONTROL_OUTLINE } } },
        base: {
          content: {
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-pop)",
          },
        },
      },
    },
    semanticTokens: {
      // l2: inputs, selects y controles; l3: paneles flotantes chicos.
      radii: {
        l1: { value: "var(--radius-xs)" },
        l2: { value: "var(--radius-sm)" },
        l3: { value: "var(--radius-md)" },
      },
      shadows: {
        xs: { value: "var(--shadow-control)" },
        sm: { value: "var(--shadow-card)" },
        md: { value: "var(--shadow-pop)" },
        lg: { value: "var(--shadow-pop)" },
        xl: { value: "var(--shadow-overlay)" },
        "2xl": { value: "var(--shadow-overlay)" },
      },
      colors: {
        // Texto por defecto de los componentes de Chakra: verde muy oscuro
        // (--text-h) en vez de negro, para bajar el contraste.
        fg: { value: "var(--text-h)" },
        // Fondo de diálogos, menús, popovers y calendarios: el blanco roto
        // de la app.
        bg: {
          panel: { value: "var(--panel)" },
        },
        // La paleta por defecto es gris (botones "Cancelar" neutros), pero el
        // anillo de foco es siempre el verde de la marca.
        gray: {
          focusRing: { value: "{colors.verdeVacca}" },
        },
        brand: {
          border: { value: "var(--border)" },
          solid: { value: "{colors.verdeVacca}" },
          contrast: { value: "white" },
          fg: { value: "{colors.verdeBosque}" },
          muted: { value: "var(--verde-pastel)" },
          subtle: { value: "var(--verde-pastel)" },
          emphasized: { value: "{colors.verdeBosque}" },
          focusRing: { value: "{colors.verdeVacca}" },
        },
        danger: {
          solid: { value: "{colors.rojoAlerta}" },
          contrast: { value: "white" },
          fg: { value: "{colors.rojoAlerta}" },
          muted: { value: "var(--danger-bg)" },
          subtle: { value: "var(--danger-bg)" },
          emphasized: { value: "var(--danger-border)" },
          focusRing: { value: "{colors.rojoAlerta}" },
        },
        warning: {
          solid: { value: "{colors.ambarAviso}" },
          contrast: { value: "var(--text-h)" },
          fg: { value: "{colors.ambarAviso}" },
          muted: { value: "var(--warning-bg)" },
          subtle: { value: "var(--warning-bg)" },
          emphasized: { value: "var(--warning-border)" },
          focusRing: { value: "{colors.ambarAviso}" },
        },
        success: {
          solid: { value: "{colors.verdeConfirmacion}" },
          contrast: { value: "white" },
          fg: { value: "{colors.verdeConfirmacion}" },
          muted: { value: "var(--success-bg)" },
          subtle: { value: "var(--success-bg)" },
          emphasized: { value: "var(--success-border)" },
          focusRing: { value: "{colors.verdeConfirmacion}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
