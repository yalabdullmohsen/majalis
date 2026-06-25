import { useEffect, useState } from "react";

type Props = {
  target: number;
  label?: string;
};

export function TasbeehCounter({ target, label = "عداد التسبيح" }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
  }, [target]);

  const done = count >= target;
  const progress = target > 0 ? Math.min(100, (count / target) * 100) : 0;

  return (
    <div className="tasbeeh-counter">
      <div className="tasbeeh-counter__head">
        <span>{label}</span>
        <strong>{count} / {target}</strong>
      </div>
      <div className="tasbeeh-counter__bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="tasbeeh-counter__actions">
        <button type="button" className="tasbeeh-counter__btn" onClick={() => setCount((c) => Math.min(target, c + 1))}>
          +1
        </button>
        <button type="button" className="tasbeeh-counter__btn tasbeeh-counter__btn--ghost" onClick={() => setCount(0)}>
          إعادة
        </button>
      </div>
      {done && <p className="tasbeeh-counter__done">تمت التسبيحات المطلوبة — بارك الله فيك</p>}
    </div>
  );
}

export default TasbeehCounter;
