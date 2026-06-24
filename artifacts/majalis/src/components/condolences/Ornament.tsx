type Props = { small?: boolean };

export function Ornament({ small = false }: Props) {
  return (
    <div
      className={`relative flex items-center justify-center ${small ? "mt-5 w-44" : "w-72"}`}
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-white/50" />
      <span className="mx-3 text-white/80">۞</span>
      <span className="h-px flex-1 bg-white/50" />
    </div>
  );
}
