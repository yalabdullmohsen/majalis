import { useState } from "react";
import { SheikhAvatar } from "./SheikhAvatar";

type Props = {
  name: string;
  src: string;
  alt: string;
  className?: string;
};

export function TeacherPhoto({ name, src, alt, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`lad-teacher-photo lad-teacher-photo--fallback ${className}`.trim()}>
        <SheikhAvatar name={name} size="xl" />
      </div>
    );
  }

  return (
    <div className={`lad-teacher-photo ${className}`.trim()}>
      <img
        src={src}
        alt={alt}
        className="lad-teacher-photo__img"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
