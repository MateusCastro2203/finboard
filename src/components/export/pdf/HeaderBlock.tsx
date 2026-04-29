import { GOLD, BORDER, TEXT, TEXT2, TEXT3 } from "./shared";
import type { Company } from "../../../types";

interface Props {
  company: Company;
  periodRange: string;
  generatedAt: string;
  title: string;
}

export default function HeaderBlock({ company, periodRange, generatedAt, title }: Props) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant', serif", fontSize: 22, fontWeight: 400, color: GOLD, letterSpacing: "0.06em" }}>
            FinBoard
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginTop: 2 }}>{company.name}</div>
          {company.cnpj && (
            <div style={{ fontSize: 10, color: TEXT3, marginTop: 1 }}>
              CNPJ {company.cnpj}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: TEXT2 }}>{title}</div>
          <div style={{ fontSize: 10, color: TEXT3, marginTop: 2 }}>{periodRange}</div>
          <div style={{ fontSize: 10, color: TEXT3 }}>{generatedAt}</div>
        </div>
      </div>
      <div style={{ height: 2, background: GOLD, borderRadius: 1 }} />
    </div>
  );
}
