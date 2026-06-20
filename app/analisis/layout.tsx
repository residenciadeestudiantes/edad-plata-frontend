import { AnalisisGate } from "./AnalisisGate";
import { AnalisisSubnav } from "./AnalisisSubnav";

export default function AnalisisLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AnalisisGate>
      <div className="flex flex-1 flex-col">
        <AnalisisSubnav />
        {children}
      </div>
    </AnalisisGate>
  );
}
