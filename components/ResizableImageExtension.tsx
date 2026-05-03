import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useRef, useState, useCallback } from "react";

/* ── Node view component ─────────────────────────────────── */
function ResizableImageView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const { src, alt, title, width, align } = node.attrs as { src: string; alt?: string; title?: string; width: string; align: string };
  const startX   = useRef(0);
  const startW   = useRef(0);
  const imgRef   = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = imgRef.current?.offsetWidth ?? parseInt(width) ?? 400;
    setDragging(true);

    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(80, startW.current + (ev.clientX - startX.current));
      updateAttributes({ width: `${newW}px` });
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [updateAttributes, width]);

  const alignStyle: Record<string, React.CSSProperties> = {
    left:   { marginRight: "auto", marginLeft: "0",    display: "block" },
    center: { marginLeft:  "auto", marginRight: "auto", display: "block" },
    right:  { marginLeft:  "auto", marginRight: "0",    display: "block" },
  };

  return (
    <NodeViewWrapper
      style={{ display: "block", textAlign: align === "center" ? "center" : align === "right" ? "right" : "left" }}
    >
      <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
        {/* Floating toolbar when selected */}
        {selected && (
          <div style={{
            position: "absolute", top: "-36px", left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: "2px", background: "#1f2937", borderRadius: "6px",
            padding: "3px 5px", zIndex: 50, whiteSpace: "nowrap",
          }}>
            {(["left", "center", "right"] as const).map((a) => (
              <button key={a} type="button"
                onClick={() => updateAttributes({ align: a })}
                title={`Align ${a}`}
                style={{
                  color: align === a ? "#fbbf24" : "#e5e7eb",
                  background: "none", border: "none", cursor: "pointer",
                  padding: "2px 5px", fontSize: "13px", borderRadius: "4px",
                }}>
                {a === "left" ? "⬅" : a === "center" ? "↔" : "➡"}
              </button>
            ))}
            <span style={{ width: "1px", background: "#4b5563", margin: "2px 3px" }} />
            {["25%", "50%", "75%", "100%"].map((w) => (
              <button key={w} type="button"
                onClick={() => updateAttributes({ width: w })}
                title={`Width ${w}`}
                style={{
                  color: width === w ? "#fbbf24" : "#e5e7eb",
                  background: "none", border: "none", cursor: "pointer",
                  padding: "2px 5px", fontSize: "11px", borderRadius: "4px",
                }}>
                {w}
              </button>
            ))}
          </div>
        )}

        {/* Image */}
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ""}
          title={title ?? ""}
          draggable={false}
          style={{
            width,
            maxWidth: "100%",
            display: "block",
            cursor: dragging ? "ew-resize" : "default",
            outline: selected ? "2px solid #3b82f6" : "none",
            borderRadius: "2px",
            ...alignStyle[align],
          }}
        />

        {/* Right drag handle */}
        {selected && (
          <div
            onMouseDown={onMouseDown}
            style={{
              position: "absolute", right: "-5px", top: "50%",
              transform: "translateY(-50%)",
              width: "10px", height: "32px", background: "#3b82f6",
              borderRadius: "4px", cursor: "ew-resize", zIndex: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div style={{ width: "2px", height: "16px", background: "white", borderRadius: "1px" }} />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/* ── TipTap extension ────────────────────────────────────── */
const ResizableImage = Node.create({
  name: "resizableImage",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src:   { default: null },
      alt:   { default: null },
      title: { default: null },
      width: { default: "100%" },
      align: { default: "left" },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { align, width, ...rest } = HTMLAttributes;
    const style = [
      `width:${width}`,
      align === "center" ? "margin:0 auto;display:block" :
      align === "right"  ? "margin-left:auto;display:block" :
                           "display:block",
    ].join(";");
    return ["img", mergeAttributes(rest, { style })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;
