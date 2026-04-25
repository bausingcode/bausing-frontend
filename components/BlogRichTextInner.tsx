"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ImageIcon,
  Link as LinkIcon,
  Unlink,
  Eraser,
} from "lucide-react";
import { uploadBlogPostImageFile } from "@/lib/api";

type Props = {
  value: string;
  onChange: (html: string) => void;
  postId: string | null;
  onImageUploadError: (message: string) => void;
  onNeedPostId?: () => void;
  placeholder?: string;
};

function ToolbarButton({
  onClick,
  active,
  children,
  title,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border text-gray-700 transition-colors",
        active
          ? "border-blue-500 bg-blue-50 text-blue-800"
          : "border-gray-200 bg-white hover:bg-gray-50",
        disabled ? "pointer-events-none opacity-40" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function linkFromEditor(editor: Editor) {
  const prev = editor.getAttributes("link").href as string | undefined;
  const url = typeof window !== "undefined" ? window.prompt("URL del enlace", prev || "https://") : null;
  if (url === null) return;
  const t = url.trim();
  if (t === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: t }).run();
}

function BlogToolbar({
  editor,
  onInsertImage,
}: {
  editor: Editor;
  onInsertImage: () => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50/80 p-1.5"
      role="toolbar"
      aria-label="Formato de texto"
    >
      <ToolbarButton
        title="Negrita"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Cursiva"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Subrayado"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Tachado"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-0.5 w-px self-stretch bg-gray-200" />
      <ToolbarButton
        title="Título 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Título 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Título 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-0.5 w-px self-stretch bg-gray-200" />
      <label
        className="inline-flex h-8 cursor-pointer items-center rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-600 hover:bg-gray-50"
        title="Color de texto"
      >
        <input
          type="color"
          className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
          onInput={(e) => {
            const c = (e.target as HTMLInputElement).value;
            editor.chain().focus().setColor(c).run();
          }}
        />
        <span className="pl-0.5">A</span>
      </label>
      <label
        className="inline-flex h-8 cursor-pointer items-center rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-600 hover:bg-gray-50"
        title="Resaltado / fondo"
      >
        <input
          type="color"
          className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
          defaultValue="#fff59d"
          onInput={(e) => {
            const c = (e.target as HTMLInputElement).value;
            editor.chain().focus().toggleHighlight({ color: c }).run();
          }}
        />
        <span className="pl-0.5">H</span>
      </label>
      <span className="mx-0.5 w-px self-stretch bg-gray-200" />
      <ToolbarButton
        title="Lista con viñetas"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-0.5 w-px self-stretch bg-gray-200" />
      <ToolbarButton
        title="Enlace"
        active={editor.isActive("link")}
        onClick={() => linkFromEditor(editor)}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Quitar enlace"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
      >
        <Unlink className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Imagen" onClick={onInsertImage}>
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-0.5 w-px self-stretch bg-gray-200" />
      <ToolbarButton
        title="Quitar estilos (selección)"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        <Eraser className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export default function BlogRichTextInner({
  value,
  onChange,
  postId,
  onImageUploadError,
  onNeedPostId,
  placeholder = "Escribí el artículo…",
}: Props) {
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#00C1A7] underline underline-offset-2" },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: "max-w-full h-auto rounded-lg my-4" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value && value.trim() !== "" ? value : "<p></p>",
    editorProps: {
      attributes: {
        class: "min-h-[240px] px-3 py-2 text-[15px] text-gray-900 focus:outline-none tiptap",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const onInsertImage = useCallback(() => {
    if (!postId) {
      onNeedPostId?.();
      return;
    }
    const ed = editorRef.current;
    if (!ed) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const img = await uploadBlogPostImageFile(file, postId);
        ed.chain().focus().setImage({ src: img.image_url, alt: file.name }).run();
      } catch (e) {
        onImageUploadError(
          e instanceof Error ? e.message : "Error al subir la imagen"
        );
      }
    };
  }, [postId, onImageUploadError, onNeedPostId]);

  if (!editor) {
    return (
      <div className="min-h-[320px] rounded-lg border border-gray-200 bg-gray-100 animate-pulse" />
    );
  }

  return (
    <div className="blog-rich-text">
      <BlogToolbar editor={editor} onInsertImage={onInsertImage} />
      <EditorContent
        editor={editor}
        className="rounded-b-lg border border-gray-300 bg-white [&_.tiptap]:min-h-[240px]"
      />
    </div>
  );
}
