import type { StrapiBlocksContent } from "./api";

type InlineNode = {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  children?: InlineNode[];
};

type BlockNode = {
  type: string;
  level?: number;
  format?: "ordered" | "unordered";
  children?: InlineNode[];
};

function renderInline(node: InlineNode, key: number): React.ReactNode {
  if (node.type === "link" && node.url) {
    return (
      <a
        key={key}
        href={node.url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-900 dark:hover:text-zinc-50"
      >
        {(node.children ?? []).map((child, i) => renderInline(child, i))}
      </a>
    );
  }

  let content: React.ReactNode = node.text ?? "";
  if (node.code) content = <code>{content}</code>;
  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  if (node.underline) content = <u>{content}</u>;
  if (node.strikethrough) content = <s>{content}</s>;

  return <span key={key}>{content}</span>;
}

function Heading({
  level,
  children,
}: {
  level: number;
  children: React.ReactNode;
}) {
  switch (level) {
    case 1:
      return <h1 className="text-2xl font-bold tracking-tight">{children}</h1>;
    case 2:
      return <h2 className="text-xl font-bold tracking-tight">{children}</h2>;
    case 3:
      return (
        <h3 className="text-lg font-semibold tracking-tight">{children}</h3>
      );
    case 4:
      return (
        <h4 className="text-base font-semibold tracking-tight">{children}</h4>
      );
    case 5:
      return (
        <h5 className="text-sm font-semibold tracking-tight">{children}</h5>
      );
    default:
      return (
        <h6 className="text-sm font-semibold tracking-tight">{children}</h6>
      );
  }
}

function renderBlock(block: BlockNode, key: number): React.ReactNode {
  const children = (block.children ?? []).map((child, i) =>
    renderInline(child, i)
  );

  switch (block.type) {
    case "heading":
      return (
        <Heading key={key} level={block.level ?? 2}>
          {children}
        </Heading>
      );
    case "list": {
      const ListTag = block.format === "ordered" ? "ol" : "ul";
      return (
        <ListTag
          key={key}
          className={
            block.format === "ordered" ? "list-decimal pl-6" : "list-disc pl-6"
          }
        >
          {(block.children ?? []).map((item, i) => (
            <li key={i}>
              {(item.children ?? []).map((child, j) => renderInline(child, j))}
            </li>
          ))}
        </ListTag>
      );
    }
    case "quote":
      return (
        <blockquote
          key={key}
          className="border-l-2 border-zinc-300 pl-4 italic dark:border-zinc-700"
        >
          {children}
        </blockquote>
      );
    case "code":
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-900"
        >
          <code>{children}</code>
        </pre>
      );
    case "paragraph":
    default:
      return <p key={key}>{children}</p>;
  }
}

export function BlocksRenderer({ content }: { content: StrapiBlocksContent }) {
  return (
    <div className="flex flex-col gap-3">
      {content.map((block, i) => renderBlock(block as BlockNode, i))}
    </div>
  );
}

function plainTextFromInline(node: InlineNode): string {
  if (node.text) return node.text;
  return (node.children ?? []).map(plainTextFromInline).join("");
}

// Texto plano equivalente al contenido de bloques, usado para medir y
// truncar biografías largas sin tener que cortar el árbol de bloques a
// mitad de un nodo con formato.
export function extractPlainText(content: StrapiBlocksContent): string {
  return content
    .map((block) => (block as BlockNode).children?.map(plainTextFromInline).join("") ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
