export interface InstitutionalPageEntry {
  path: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
}

/**
 * Páginas institucionales editables desde /admin/seo (pestaña "Metadatos").
 * Los valores default son los títulos/descripciones hardcodeados que cada
 * página usa hoy cuando no hay override guardado.
 */
export const INSTITUTIONAL_PAGES: InstitutionalPageEntry[] = [
  {
    path: "/catalogo",
    label: "Catálogo (listado raíz)",
    defaultTitle: "Catálogo",
    defaultDescription:
      "Explorá colchones, sommiers y productos de descanso en Bausing. Filtrá por categoría, medidas y comodidad. Comprá online con envío.",
  },
  {
    path: "/blog",
    label: "Blog",
    defaultTitle: "Blog",
    defaultDescription:
      "Consejos sobre descanso, colchones y hábitos para dormir mejor. Artículos del equipo Bausing.",
  },
  {
    path: "/local",
    label: "Local",
    defaultTitle: "Local",
    defaultDescription:
      "Conocé Bausing: locales, contacto y redes. Estamos para ayudarte a elegir tu colchón ideal.",
  },
  {
    path: "/terminos-y-condiciones",
    label: "Términos y condiciones",
    defaultTitle: "Términos y condiciones",
    defaultDescription:
      "Términos y condiciones de uso de la tienda Bausing y compra de productos online.",
  },
  {
    path: "/preguntas-frecuentes",
    label: "Preguntas frecuentes",
    defaultTitle: "Preguntas frecuentes",
    defaultDescription:
      "Respondemos las dudas más comunes sobre envíos, pagos, garantía y productos Bausing.",
  },
  {
    path: "/programa-de-referidos",
    label: "Programa de Referidos",
    defaultTitle: "Programa de Referidos",
    defaultDescription:
      "Recomendá Bausing y ganá Pesos Bausing. Compartí tu código único con amigos y familiares y acumulá créditos para usar en tus próximas compras.",
  },
  {
    path: "/programa-de-creadores",
    label: "Programa de Creadores",
    defaultTitle: "Programa de Creadores",
    defaultDescription:
      "Creá contenido mostrando productos Bausing y generá ingresos. No hace falta ser influencer, solo ganas de crear y compartir.",
  },
  {
    path: "/club-beneficios",
    label: "Club de Beneficios",
    defaultTitle: "Club de Beneficios",
    defaultDescription:
      "Sumate al Club de Beneficios de Bausing y accedé a descuentos y promociones exclusivas.",
  },
  {
    path: "/politica-de-privacidad",
    label: "Política de Privacidad",
    defaultTitle: "Política de Privacidad",
    defaultDescription:
      "Política de privacidad de Bausing: cómo recopilamos, utilizamos y protegemos tu información personal.",
  },
];
