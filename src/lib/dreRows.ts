export const DRE_ROWS = [
  { key: "receita_bruta",            label: "(+) Receita Bruta",             bold: false, positive: true,  subtotal: false    },
  { key: "deducoes",                 label: "(-) Deduções",                   bold: false, positive: false, subtotal: false    },
  { key: "receita_liquida",          label: "(=) Receita Líquida",           bold: true,  positive: true,  subtotal: false    },
  { key: "cmv",                      label: "(-) CMV / CPV",                  bold: false, positive: false, subtotal: false    },
  { key: "lucro_bruto",              label: "(=) Lucro Bruto",               bold: true,  positive: true,  subtotal: "gold"   },
  { key: "despesas_comerciais",      label: "(-) Desp. Comerciais",          bold: false, positive: false, subtotal: false    },
  { key: "despesas_administrativas", label: "(-) Desp. Administrativas",     bold: false, positive: false, subtotal: false    },
  { key: "despesas_pessoal",         label: "(-) Desp. de Pessoal",          bold: false, positive: false, subtotal: false    },
  { key: "outras_despesas_op",       label: "(-) Outras Desp. Operacionais", bold: false, positive: false, subtotal: false    },
  { key: "ebitda",                   label: "(=) EBITDA",                    bold: true,  positive: true,  subtotal: "green"  },
  { key: "depreciacao",              label: "(-) Depreciação e Amortização", bold: false, positive: false, subtotal: false    },
  { key: "ebit",                     label: "(=) EBIT",                      bold: true,  positive: true,  subtotal: false    },
  { key: "resultado_financeiro",     label: "(+/-) Resultado Financeiro",    bold: false, positive: null,  subtotal: false    },
  { key: "lair",                     label: "(=) LAIR",                      bold: true,  positive: true,  subtotal: false    },
  { key: "ir_csll",                  label: "(-) IR e CSLL",                 bold: false, positive: false, subtotal: false    },
  { key: "lucro_liquido",            label: "(=) Lucro Líquido",             bold: true,  positive: true,  subtotal: "blue"   },
] as const;

export type DreRowKey = typeof DRE_ROWS[number]["key"];
