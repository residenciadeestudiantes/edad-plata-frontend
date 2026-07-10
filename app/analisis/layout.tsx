import { AnalisisGate } from "./AnalisisGate";
import { AnalisisSubnav } from "./AnalisisSubnav";

export default function AnalisisLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AnalisisGate>
      <div className="flex flex-1 flex-col sm:flex-row">
        <AnalisisSubnav />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </AnalisisGate>
  );
}
