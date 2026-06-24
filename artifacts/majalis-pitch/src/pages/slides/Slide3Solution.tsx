export default function Slide3Solution() {
  return (
    <div
      dir="rtl"
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #164E3C 0%, #1F6E54 100%)" }}
    >
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          left: 0,
          height: "0.4vh",
          background: "#B08D2E",
        }}
      />

      <div
        className="absolute"
        style={{
          bottom: 0,
          right: 0,
          left: 0,
          height: "0.25vh",
          background: "rgba(176,141,46,0.4)",
        }}
      />

      <div
        className="absolute"
        style={{
          top: "8vh",
          right: "8vw",
          left: "8vw",
        }}
      >
        <div
          style={{
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "2.2vw",
            fontWeight: "400",
            color: "#CFE0D3",
            letterSpacing: "0.05em",
          }}
        >
          الحل
        </div>
        <div
          style={{
            marginTop: "1vh",
            fontFamily: "Amiri, Georgia, serif",
            fontSize: "7vw",
            fontWeight: "700",
            color: "#FAF5EA",
            lineHeight: 1.1,
            textWrap: "balance",
          }}
        >
          مجالس العلم
        </div>
        <div
          style={{
            marginTop: "0.5vh",
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "3vw",
            fontWeight: "300",
            color: "#CFE0D3",
            lineHeight: 1.4,
          }}
        >
          منصة شاملة تجمع العلم الشرعي في مكان واحد
        </div>
        <div
          style={{
            marginTop: "1.5vh",
            width: "8vw",
            height: "0.2vh",
            background: "#B08D2E",
          }}
        />
      </div>

      <div
        className="absolute"
        style={{
          top: "50vh",
          right: "8vw",
          left: "8vw",
          display: "flex",
          gap: "3vw",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "2.6vw",
              fontWeight: "700",
              color: "#B08D2E",
            }}
          >
            —
          </div>
          <div
            style={{
              marginTop: "0.8vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "3vw",
              fontWeight: "700",
              color: "#FAF5EA",
              lineHeight: 1.3,
            }}
          >
            دروس منظّمة
          </div>
          <div
            style={{
              marginTop: "1vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.3vw",
              fontWeight: "300",
              color: "#CFE0D3",
              lineHeight: 1.5,
            }}
          >
            تصفّح وسجّل في الدروس حسب المدينة والتخصص
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "2.6vw",
              fontWeight: "700",
              color: "#B08D2E",
            }}
          >
            —
          </div>
          <div
            style={{
              marginTop: "0.8vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "3vw",
              fontWeight: "700",
              color: "#FAF5EA",
              lineHeight: 1.3,
            }}
          >
            مشايخ معتمدون
          </div>
          <div
            style={{
              marginTop: "1vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.3vw",
              fontWeight: "300",
              color: "#CFE0D3",
              lineHeight: 1.5,
            }}
          >
            ملفات شخصية موثّقة للمشايخ ودروسهم
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "2.6vw",
              fontWeight: "700",
              color: "#B08D2E",
            }}
          >
            —
          </div>
          <div
            style={{
              marginTop: "0.8vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "3vw",
              fontWeight: "700",
              color: "#FAF5EA",
              lineHeight: 1.3,
            }}
          >
            مكتبة وفوائد
          </div>
          <div
            style={{
              marginTop: "1vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.3vw",
              fontWeight: "300",
              color: "#CFE0D3",
              lineHeight: 1.5,
            }}
          >
            مصادر علمية مصنّفة وفوائد مختارة من المشايخ
          </div>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "5vh",
          left: "8vw",
          fontFamily: "Almarai, Tahoma, sans-serif",
          fontSize: "2vw",
          fontWeight: "700",
          color: "rgba(207,224,211,0.4)",
          letterSpacing: "0.05em",
        }}
      >
        Majalis Al-Ilm
      </div>
    </div>
  );
}
