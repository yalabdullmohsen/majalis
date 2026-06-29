import { Redirect } from "wouter";

/** @deprecated Use /library hub */
export default function LibraryPage() {
  return <Redirect to="/library" />;
}
