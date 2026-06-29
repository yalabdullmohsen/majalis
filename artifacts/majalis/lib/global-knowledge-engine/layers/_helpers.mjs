/** Layer status helper */
export function layerStatus(id, label, phase, implPhase, delegate) {
  const active = implPhase <= phase;
  return {
    id,
    label,
    phase,
    status: active ? "active" : "pending",
    implementation: active ? "delegated" : "architecture",
    delegate,
  };
}
