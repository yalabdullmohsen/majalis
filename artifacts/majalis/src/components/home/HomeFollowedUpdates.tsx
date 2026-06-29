import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { fetchFollowedSheikhUpdates } from "@/lib/personal-learning/sheikh-follow";

export function HomeFollowedUpdates() {
  const [items, setItems] = useState<Array<{ id: string; title: string; sheikhName: string }>>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      fetchFollowedSheikhUpdates(4).then((lessons) =>
        setItems(lessons.map((l) => ({ id: l.id, title: l.title, sheikhName: l.sheikhName }))),
      );
    });
  }, []);

  if (!items.length) return null;

  return (
    <section className="home-section" aria-label="من المشايخ الذين تتابعهم">
      <div className="home-section-head">
        <h2 className="home-section-title">من المشايخ الذين تتابعهم</h2>
        <Link href="/my-updates" className="home-section-link">كل التحديثات</Link>
      </div>
      <ul className="personal-updates-list">
        {items.map((item) => (
          <li key={item.id} className="personal-panel">
            <Link href={`/lessons/${item.id}`} className="personal-update-title">{item.title}</Link>
            <p className="personal-stat-sub">{item.sheikhName}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default HomeFollowedUpdates;
