"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

interface Props {
  initialContent?: string;
  name?: string;
}

export default function JobDescriptionEditor({
  initialContent = "",
  name = "description",
}: Props) {
  const [html, setHtml] = useState(initialContent);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
      Placeholder.configure({ placeholder: "Describe the role, responsibilities, and requirements…" }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  if (!editor) return null;

  const btn = (active: boolean, title: string, onClick: () => void, label: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm transition-colors hover:bg-gray-200 ${active ? "bg-gray-200" : ""}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">Description</label>

      {/* Hidden input carries the HTML value for FormData */}
      <input type="hidden" name={name} value={html} />

      <div className="border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">
          {btn(editor.isActive("bold"),      "Bold",          () => editor.chain().focus().toggleBold().run(),         <b>B</b>)}
          {btn(editor.isActive("italic"),    "Italic",        () => editor.chain().focus().toggleItalic().run(),       <i>I</i>)}
          {btn(editor.isActive("underline"), "Underline",     () => editor.chain().focus().toggleUnderline().run(),    <u>U</u>)}

          <span className="w-px h-5 bg-gray-300 mx-1" />

          {btn(editor.isActive("heading", { level: 2 }), "Heading 2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2")}
          {btn(editor.isActive("heading", { level: 3 }), "Heading 3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3")}

          <span className="w-px h-5 bg-gray-300 mx-1" />

          {btn(editor.isActive("bulletList"),  "Bullet list",  () => editor.chain().focus().toggleBulletList().run(),  "• List")}
          {btn(editor.isActive("orderedList"), "Ordered list", () => editor.chain().focus().toggleOrderedList().run(), "1. List")}

          <span className="w-px h-5 bg-gray-300 mx-1" />

          {btn(false, "Undo", () => editor.chain().focus().undo().run(), "↩")}
          {btn(false, "Redo", () => editor.chain().focus().redo().run(), "↪")}
        </div>

        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none min-h-[200px] p-4 [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px]"
        />
      </div>
      <p className="text-xs text-gray-400">Select text to format. Press Enter for a new paragraph.</p>
    </div>
  );
}
