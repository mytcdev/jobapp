"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import ResizableImage from "./ResizableImageExtension";
import { useRef } from "react";

type Props = {
  content: string;
  onChange: (html: string) => void;
};

export default function RichEditor({ content, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Write your content here…" }),
      Link.configure({ openOnClick: false }),
      ResizableImage,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  async function insertImage() {
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = "";

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/cms/upload", { method: "POST", body: fd });
    if (!res.ok) { alert("Image upload failed."); return; }
    const { url } = await res.json();
    editor.chain().focus().insertContent({ type: "resizableImage", attrs: { src: url } }).run();
  }

  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url  = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const btn = (active: boolean, title: string, onClick: () => void, label: React.ReactNode) => (
    <button type="button" title={title} onClick={onClick}
      className={`px-2 py-1 rounded text-sm hover:bg-gray-200 transition-colors ${active ? "bg-gray-200 font-bold" : ""}`}>
      {label}
    </button>
  );

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">
        {btn(editor.isActive("bold"),      "Bold",          () => editor.chain().focus().toggleBold().run(),          <b>B</b>)}
        {btn(editor.isActive("italic"),    "Italic",        () => editor.chain().focus().toggleItalic().run(),        <i>I</i>)}
        {btn(editor.isActive("underline"), "Underline",     () => editor.chain().focus().toggleUnderline().run(),     <u>U</u>)}
        {btn(editor.isActive("strike"),    "Strikethrough", () => editor.chain().focus().toggleStrike().run(),        <s>S</s>)}

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {btn(editor.isActive("heading", { level: 1 }), "H1", () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "H1")}
        {btn(editor.isActive("heading", { level: 2 }), "H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2")}
        {btn(editor.isActive("heading", { level: 3 }), "H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3")}

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {btn(editor.isActive({ textAlign: "left" }),    "Align left",    () => editor.chain().focus().setTextAlign("left").run(),    "⬅")}
        {btn(editor.isActive({ textAlign: "center" }), "Align center",  () => editor.chain().focus().setTextAlign("center").run(),  "↔")}
        {btn(editor.isActive({ textAlign: "right" }),  "Align right",   () => editor.chain().focus().setTextAlign("right").run(),   "➡")}

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {btn(editor.isActive("bulletList"),  "Bullet list",   () => editor.chain().focus().toggleBulletList().run(),   "• List")}
        {btn(editor.isActive("orderedList"), "Ordered list",  () => editor.chain().focus().toggleOrderedList().run(),  "1. List")}
        {btn(editor.isActive("blockquote"),  "Blockquote",    () => editor.chain().focus().toggleBlockquote().run(),   "❝")}
        {btn(false,                          "Code block",    () => editor.chain().focus().toggleCodeBlock().run(),    "</>")}

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {btn(editor.isActive("link"),        "Link",          setLink,                                                 "🔗")}
        {btn(false,                          "Insert image",  insertImage,                                             "🖼")}

        <span className="w-px h-5 bg-gray-300 mx-1" />

        {btn(false, "Undo", () => editor.chain().focus().undo().run(), "↩")}
        {btn(false, "Redo", () => editor.chain().focus().redo().run(), "↪")}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <EditorContent editor={editor}
        className="prose prose-sm max-w-none min-h-[320px] p-4 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]" />
    </div>
  );
}
