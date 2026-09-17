import { Fragment } from "react";

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

/** Renders the light markdown used by learning modules: ##, -, 1., **bold**. */
export function SimpleProse({ body }: { body: string }) {
  const lines = body.split("\n");
  const blocks: JSX.Element[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  function flush(key: number) {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`list-${key}`}
        className={`my-3 space-y-1.5 pl-5 ${list.ordered ? "list-decimal" : "list-disc"}`}
      >
        {list.items.map((item, index) => (
          <li key={index}>{inline(item)}</li>
        ))}
      </Tag>,
    );
    list = null;
  }

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flush(index);
      blocks.push(
        <h2 key={index} className="mt-6 font-display text-lg font-semibold">
          {inline(line.slice(3))}
        </h2>,
      );
      return;
    }
    if (line.startsWith("- ")) {
      if (!list || list.ordered) flush(index);
      list = list ?? { ordered: false, items: [] };
      list.items.push(line.slice(2));
      return;
    }
    const ordered = /^\d+\.\s+/.exec(line);
    if (ordered) {
      if (!list || !list.ordered) flush(index);
      list = list ?? { ordered: true, items: [] };
      list.items.push(line.slice(ordered[0].length));
      return;
    }
    flush(index);
    if (line.length > 0) {
      blocks.push(
        <p key={index} className="mt-3 leading-relaxed">
          {inline(line)}
        </p>,
      );
    }
  });
  flush(lines.length);

  return <div className="text-sm text-foreground">{blocks}</div>;
}
