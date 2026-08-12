const lastSubmit = new Map<string, number>();

export function canSubmitForm(formKey: string, cooldownMs = 5000): boolean {
  const now = Date.now();
  const last = lastSubmit.get(formKey) ?? 0;
  if (now - last < cooldownMs) return false;
  lastSubmit.set(formKey, now);
  return true;
}

export function formCooldownRemaining(formKey: string, cooldownMs = 5000): number {
  const last = lastSubmit.get(formKey) ?? 0;
  const remaining = cooldownMs - (Date.now() - last);
  return remaining > 0 ? remaining : 0;
}
