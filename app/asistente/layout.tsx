import { ChatGate } from "@/components/ChatGate";

export default function AsistenteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ChatGate>{children}</ChatGate>;
}
