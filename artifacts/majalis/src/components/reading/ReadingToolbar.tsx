import type { ComponentProps } from "react";
import { ContentActionBar } from "./ContentActionBar";

export function ReadingToolbar(props: ComponentProps<typeof ContentActionBar>) {
  return <ContentActionBar {...props} />;
}

export default ReadingToolbar;
