import { createPortal } from "react-dom";

interface Props {
  children: React.ReactNode;
}

export default function PrintContainer({ children }: Props) {
  return createPortal(
    <div id="finboard-print-root" aria-hidden="true">
      {children}
    </div>,
    document.body,
  );
}
