import { useEffect, useState } from "react";
import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { loadTafsirRegistry, type TafsirRegistryEntry } from "@/lib/quran-data/tafsir-registry";
import {
  getVerifiedAudioRegistryEntries,
  type AudioRegistryReciter,
} from "@/lib/audio-registry";

type ContentSourceItem = {
  id: string;
  name: string;
  org: string;
  url: string;
  permission: string;
  accessedAt: string;
};

type ContentSourcesPayload = {
  updatedAt?: string;
  closingLine: string;
  sections: Array<{
    id: string;
    titleAr: string;
    items?: ContentSourceItem[];
    registryRef?: string;
    note?: string;
  }>;
};

function SourceEntry({
  name,
  org,
  url,
  permission,
  accessedAt,
}: {
  name: string;
  org: string;
  url: string;
  permission: string;
  accessedAt: string;
}) {
  return (
    <li className="legal-license-list__item-rich">
      <strong dir="auto">{name}</strong>
      <span>{org}</span>
      <a href={url} target="_blank" rel="noopener noreferrer" dir="ltr">
        {url}
      </a>
      <span>{permission}</span>
      <span className="legal-license-list__date">تاريخ الاطلاع: {accessedAt}</span>
    </li>
  );
}

function TafsirRegistryList({ entries }: { entries: TafsirRegistryEntry[] }) {
  return (
    <ul className="legal-license-list legal-license-list--rich">
      {entries.map((t) => (
        <SourceEntry
          key={t.id}
          name={t.name}
          org={t.author}
          url={t.source.url}
          permission={`${t.source.permission}${t.bundled ? " · مجمَّع" : " · عند الطلب"}`}
          accessedAt={t.source.accessedAt}
        />
      ))}
    </ul>
  );
}

function AudioRegistryList({ entries }: { entries: AudioRegistryReciter[] }) {
  if (entries.length === 0) {
    return <p>لا قرّاء معروضون حالياً — يُعرض من اجتاز فحص QA الكامل فقط.</p>;
  }
  return (
    <ul className="legal-license-list legal-license-list--rich">
      {entries.map((r) => {
        const folder = r.folder ?? "?";
        const sampleUrl = `https://everyayah.com/data/${folder}/001001.mp3`;
        const accessedAt = r.qaPassedAt?.slice(0, 10) ?? "—";
        return (
          <SourceEntry
            key={r.id}
            name={r.name ?? r.id}
            org={`EveryAyah · ${r.bitrate ?? 128} kbps · ${r.filesPresent ?? 6236} آية`}
            url={sampleUrl}
            permission="بث آية بآية — لا ملفات في الحزمة · QA ✅"
            accessedAt={accessedAt}
          />
        );
      })}
    </ul>
  );
}

export default function SourcesLicensesPage() {
  const [payload, setPayload] = useState<ContentSourcesPayload | null>(null);
  const [tafsirs, setTafsirs] = useState<TafsirRegistryEntry[]>([]);
  const [audioReciters, setAudioReciters] = useState<AudioRegistryReciter[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/sources",
      title: "المصادر والتراخيص | المجلس العلمي",
      description:
        "جرد مصادر البيانات والأصول الرقمية في المجلس العلمي وحالة الإذن والترخيص لكل أصل.",
      keywords: ["مصادر", "تراخيص", "QPC", "المجلس العلمي", "حقوق"],
    });
    void fetch("/data/content-sources.json", { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setPayload(j as ContentSourcesPayload))
      .catch(() => setPayload(null));
    void loadTafsirRegistry().then((r) => setTafsirs(r.tafsirs ?? []));
    void getVerifiedAudioRegistryEntries().then(setAudioReciters);
  }, []);

  const updatedAt = payload?.updatedAt?.slice(0, 10) ?? "2026-08-19";

  return (
    <LegalPageLayout eyebrow="الشفافية" title="المصادر والتراخيص" updatedAt={updatedAt}>
      <LegalSection title="الغرض من هذه الصفحة">
        <p>
          تُولَّد هذه الصفحة آلياً من <code dir="ltr">docs/CONTENT_SOURCES.md</code> و{" "}
          <code dir="ltr">public/data/content-sources.json</code> وسجلّي التفسير والصوت — لا نص
          يدوي متعفّن في الواجهة.
        </p>
        <p>
          المنهجية في <Link href="/methodology">منهجية التوثيق</Link>. الجرد الكامل في{" "}
          <code dir="ltr">docs/LICENSES.md</code>.
        </p>
      </LegalSection>

      {payload?.sections.map((section) => (
        <LegalSection key={section.id} title={section.titleAr}>
          {section.id === "tafsir-text" ? (
            <TafsirRegistryList entries={tafsirs} />
          ) : section.id === "recitations" ? (
            <>
              {section.items?.length ? (
                <ul className="legal-license-list legal-license-list--rich">
                  {section.items.map((item) => (
                    <SourceEntry key={item.id} {...item} />
                  ))}
                </ul>
              ) : null}
              {section.registryRef ? (
                <>
                  <p className="legal-license-list__subtitle">قرّاء مُحقَّقون (QA كامل 6236)</p>
                  <AudioRegistryList entries={audioReciters} />
                </>
              ) : null}
            </>
          ) : section.items?.length ? (
            <ul className="legal-license-list legal-license-list--rich">
              {section.items.map((item) => (
                <SourceEntry key={item.id} {...item} />
              ))}
            </ul>
          ) : (
            <p>{section.note ?? "—"}</p>
          )}
        </LegalSection>
      ))}

      <LegalSection title="سطر ختامي">
        <p>{payload?.closingLine ?? "جزى الله القائمين على هذه المصادر خيراً."}</p>
      </LegalSection>

      <LegalBackLink />
      <ShareButtons
        title="المصادر والتراخيص — المجلس العلمي"
        url="https://www.majlisilm.com/sources"
      />
    </LegalPageLayout>
  );
}
