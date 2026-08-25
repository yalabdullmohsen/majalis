/** حافلة بسيطة لفتح/إغلاق نافذة شراكة العبد المحسن من شريط الهيدر أو الكارت. */
type Listener = (open: boolean) => void;

let modalOpen = false;
const listeners = new Set<Listener>();

export function openPartnershipAdModal(): void {
  if (modalOpen) return;
  modalOpen = true;
  for (const cb of listeners) cb(true);
}

export function closePartnershipAdModal(): void {
  if (!modalOpen) return;
  modalOpen = false;
  for (const cb of listeners) cb(false);
}

export function isPartnershipAdModalOpen(): boolean {
  return modalOpen;
}

export function subscribePartnershipAdModal(cb: Listener): () => void {
  listeners.add(cb);
  cb(modalOpen);
  return () => listeners.delete(cb);
}
