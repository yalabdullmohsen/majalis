import { RequestManager } from "@/lib/request-manager";

type AdminListLoadOpts<T> = {
  label: string;
  setLoading: (v: boolean) => void;
  load: () => Promise<T>;
  onSuccess: (data: T) => void;
  onError?: () => void;
};

/** Admin list panels — guaranteed terminal state (no infinite loading). */
export function adminListLoad<T>({ label, setLoading, load, onSuccess, onError }: AdminListLoadOpts<T>): void {
  setLoading(true);
  void RequestManager.run(label, load)
    .then(onSuccess)
    .catch(() => onError?.())
    .finally(() => setLoading(false));
}
