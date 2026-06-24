import { SheikhAvatar } from "./SheikhAvatar";

type Props = {
  name: string;
  src?: string;
  alt?: string;
  size?: number | "responsive";
  className?: string;
};

export function TeacherPhoto({ name, src, alt, size = 96, className = "" }: Props) {
  return (
    <SheikhAvatar
      src={src}
      name={alt || name}
      size={size}
      className={className}
    />
  );
}
