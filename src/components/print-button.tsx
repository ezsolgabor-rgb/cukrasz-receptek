"use client";

/** Nyomtatás gomb – a böngésző nyomtatási nézetét hívja. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-ghost print:hidden"
    >
      Nyomtatás
    </button>
  );
}
