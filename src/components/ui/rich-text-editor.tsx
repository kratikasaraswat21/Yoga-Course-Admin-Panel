import { EditorContent, useEditor } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/helper/helper";

interface RichTextEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

function ToolbarButton({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            className={cn(
              "size-8 rounded-md p-0",
              active && "!bg-slate-900 !text-white hover:!bg-slate-800 [&_svg]:!text-white",
            )}
            disabled={disabled}
            onClick={onClick}
            type="button"
            variant="outline"
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function RichTextEditor({ id, value, onChange, placeholder, className, minHeight = "min-h-36" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        alignments: ["start", "center", "end", "justify"],
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        "aria-label": placeholder ?? "Rich text editor",
        class: cn("rich-text-editor-content focus:outline-none", minHeight),
        id,
      },
    },
    onUpdate: ({ editor: updatedEditor }) => onChange(updatedEditor.getHTML()),
  });

  useEffect(() => {
    if (!editor || editor.isFocused || value === editor.getHTML()) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className={cn("overflow-hidden rounded-lg border border-input bg-white", className)}>
      <div className="flex flex-wrap gap-1 border-b bg-slate-50 p-2">
        <ToolbarButton label="Bold" icon={<Bold className="size-4" />} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} />
        <ToolbarButton label="Italic" icon={<Italic className="size-4" />} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} />
        <ToolbarButton label="Strikethrough" icon={<Strikethrough className="size-4" />} onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} />
        <ToolbarButton label="Inline code" icon={<Code2 className="size-4" />} onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} />
        <ToolbarButton label="Heading 1" icon={<Heading1 className="size-4" />} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} />
        <ToolbarButton label="Heading 2" icon={<Heading2 className="size-4" />} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} />
        <ToolbarButton label="Heading 3" icon={<Heading3 className="size-4" />} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} />
        <ToolbarButton label="Align start" icon={<AlignLeft className="size-4" />} onClick={() => editor.chain().focus().setTextAlign("start").run()} active={editor.isActive({ textAlign: "start" })} />
        <ToolbarButton label="Align center" icon={<AlignCenter className="size-4" />} onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} />
        <ToolbarButton label="Align end" icon={<AlignRight className="size-4" />} onClick={() => editor.chain().focus().setTextAlign("end").run()} active={editor.isActive({ textAlign: "end" })} />
        <ToolbarButton label="Justify" icon={<AlignJustify className="size-4" />} onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} />
        <ToolbarButton label="Bullet list" icon={<List className="size-4" />} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} />
        <ToolbarButton label="Numbered list" icon={<ListOrdered className="size-4" />} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} />
        <ToolbarButton label="Blockquote" icon={<Quote className="size-4" />} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} />
        <ToolbarButton label="Clear formatting" icon={<RemoveFormatting className="size-4" />} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} />
        <ToolbarButton label="Undo" icon={<Undo2 className="size-4" />} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
        <ToolbarButton label="Redo" icon={<Redo2 className="size-4" />} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
