/** علم عمل غير محفوظ في شيت الآية (مسودة ملاحظة). */
let dirty = false;

export function setMushafUnsavedWork(value: boolean): void {
  dirty = value;
}

export function hasMushafUnsavedWork(): boolean {
  return dirty;
}
