import { LibraryHubCards } from "@/components/library/LibraryHubCards";

export function HomeLibraryHub() {
  return (
    <section className="home-section home-library-hub ds-section" aria-labelledby="home-library-hub-heading">
      <div className="ds-section__header">
        <h2 id="home-library-hub-heading" className="ds-section__title">
          المكتبة العلمية
        </h2>
        <p className="ds-section__subtitle">كتب · مقالات · أبحاث — كل قسم مستقل</p>
      </div>
      <LibraryHubCards compact />
    </section>
  );
}

export default HomeLibraryHub;
