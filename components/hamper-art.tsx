"use client";
import { useState } from "react";

/** AI preview with graceful fallback: skeleton while painting, product photo if the free API is shy. */
export default function HamperArt({ src, fallback, alt }: { src: string; fallback: string; alt: string }) {
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  return (
    <div className="card-img aspect-[4/5] rounded-[26px] bg-lav/40">
      {state !== "err" && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setState("ok")}
          onError={() => setState("err")}
          className={"absolute inset-0 transition-opacity duration-700 " + (state === "ok" ? "opacity-100" : "opacity-0")}
        />
      )}
      {state === "err" && <img src={fallback} alt={alt} className="absolute inset-0" />}
      {state === "loading" && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-rose/30 border-t-rose" />
            <p className="mt-3 font-script text-xl text-ink-soft">our artist is sketching your hamper…</p>
          </div>
        </div>
      )}
    </div>
  );
}
