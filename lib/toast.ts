/** Fire a toast on whichever ToastHost the current page mounts. */
export function toast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("spilt-toast", { detail: message }));
}
