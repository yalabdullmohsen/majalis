export default function Slide6Library() {
  return (
    <div
      dir="rtl"
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#FAF5EA" }}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{ width: "50vw", background: "#F0E8D6" }}
      />
      <div
        className="absolute inset-y-0"
        style={{ left: "50vw", width: "0.3vw", background: "#1F6E54" }}
      />

      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          left: 0,
          height: "0.4vh",
          background: "#1F6E54",
        }}
      />

      <div
        className="absolute"
        style={{
          top: "50%",
          right: "4vw",
          transform: "translateY(-50%)",
          width: "44vw",
          paddingLeft: "3vw",
          paddingRight: "3vw",
        }}
      >
        <div
          style={{
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "2vw",
            fontWeight: "700",
            color: "#B08D2E",
          }}
        >
          المكتبة
        </div>
        <div
          style={{
            marginTop: "1.5vh",
            fontFamily: "Amiri, Georgia, serif",
            fontSize: "5.5vw",
            fontWeight: "700",
            color: "#241F18",
            lineHeight: 1.2,
            textWrap: "balance",
          }}
        >
          مصادر علمية
          <span style={{ display: "block", color: "#1F6E54" }}>مصنّفة</span>
        </div>
        <div
          style={{
            marginTop: "1.5vh",
            width: "5vw",
            height: "0.2vh",
            background: "#B08D2E",
          }}
        />
        <div
          style={{
            marginTop: "3vh",
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "2.5vw",
            fontWeight: "400",
            color: "#5B5446",
            lineHeight: 1.6,
            textWrap: "pretty",
          }}
        >
          مكتبة شاملة من الكتب والمقالات والمحاضرات، مصنّفة حسب النوع وقابلة للتصفية
        </div>
      </div>

      <div
        className="absolute"
        style={{
          top: "50%",
          left: "4vw",
          transform: "translateY(-50%)",
          width: "42vw",
          paddingLeft: "3vw",
          paddingRight: "2vw",
          display: "flex",
          flexDirection: "column",
          gap: "3vh",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "700",
              color: "#B08D2E",
              marginBottom: "0.5vh",
            }}
          >
            الفوائد
          </div>
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "3vw",
              fontWeight: "700",
              color: "#241F18",
              lineHeight: 1.3,
            }}
          >
            حكم ومقتطفات مختارة
          </div>
          <div
            style={{
              marginTop: "1vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.5,
            }}
          >
            يشاركها المشايخ وتُقرّها إدارة المنصة قبل النشر
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: "0.15vh",
            background: "#B08D2E",
            opacity: 0.4,
          }}
        />

        <div>
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "700",
              color: "#1F6E54",
              marginBottom: "0.5vh",
            }}
          >
            الإعجاز العلمي
          </div>
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "3vw",
              fontWeight: "700",
              color: "#241F18",
              lineHeight: 1.3,
            }}
          >
            مقالات موثّقة
          </div>
          <div
            style={{
              marginTop: "1vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.5,
            }}
          >
            قابلة للتصفية حسب الفئة والمصدر
          </div>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "4vh",
          right: "4vw",
          fontFamily: "Almarai, Tahoma, sans-serif",
          fontSize: "2vw",
          fontWeight: "700",
          color: "#CFE0D3",
        }}
      >
        مجالس العلم
      </div>
    </div>
  );
}
