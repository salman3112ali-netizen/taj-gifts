"use client";
import { useEffect, useRef } from "react";

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, hovering = false;

    const move = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      const t = e.target as HTMLElement;
      hovering = !!t.closest("a,button,[data-cursor]");
    };
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate(${x - 3}px, ${y - 3}px)`;
      if (ring.current) {
        ring.current.style.transform = `translate(${rx - 16}px, ${ry - 16}px) scale(${hovering ? 1.7 : 1})`;
        ring.current.style.borderColor = hovering ? "rgba(192,105,122,.65)" : "rgba(62,54,44,.28)";
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot pointer-events-none fixed left-0 top-0 z-[95] h-1.5 w-1.5 rounded-full bg-rose" />
      <div ref={ring} className="cursor-ring pointer-events-none fixed left-0 top-0 z-[94] h-8 w-8 rounded-full border transition-[border-color] duration-300" />
    </>
  );
}
