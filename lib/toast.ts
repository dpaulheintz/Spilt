/** Fire a concept-styled toast. Every fake button/link/form calls this. */
export const DEFAULT_TOAST = "Concept mockup — ships in the real build.";

export function toast(message: string = DEFAULT_TOAST) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("spilt-toast", { detail: message }));
}
