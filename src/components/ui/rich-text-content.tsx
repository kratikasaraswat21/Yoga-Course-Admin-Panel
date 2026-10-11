import { cn } from "@/utils/helper/helper";

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "S",
  "DEL",
  "CODE",
  "H1",
  "H2",
  "H3",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
]);

const sanitizeRichTextHtml = (value: string) => {
  if (typeof document === "undefined") return value;

  const container = document.createElement("div");
  container.innerHTML = value;
  container.querySelectorAll("script, style, iframe, object, embed, form").forEach((element) => element.remove());
  container.querySelectorAll("*").forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(document.createTextNode(element.textContent ?? ""));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
  });

  return container.innerHTML;
};

function RichTextContent({ html, className, fallback }: { html?: string; className?: string; fallback?: string }) {
  const content = html ? sanitizeRichTextHtml(html) : "";

  if (!content) return <span className={className}>{fallback}</span>;

  return <div className={cn("rich-text-content", className)} dangerouslySetInnerHTML={{ __html: content }} />;
}

export default RichTextContent;
