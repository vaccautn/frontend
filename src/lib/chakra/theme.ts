import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * Los valores de color acá SIEMPRE referencian las custom properties
 * definidas en src/index.css (paleta VACCA). No agregar hex nuevos:
 * si hace falta un color que no está en index.css, se define ahí primero.
 */
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
      },
      fonts: {
        heading: { value: "var(--heading)" },
        body: { value: "var(--sans)" },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
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
