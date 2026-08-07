import { FiqhGuidePage } from "@/components/FiqhGuidePage";
import { NIKAH_GUIDE } from "@/lib/fiqh-guides/nikah";

export default function NikahPage() {
  return <FiqhGuidePage section={NIKAH_GUIDE} />;
}
