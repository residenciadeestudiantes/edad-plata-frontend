import { AnalisisSubnav } from "./AnalisisSubnav";

export default function AnalisisLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <AnalisisSubnav />
      {children}
    </div>
  );
}
