export default function Slide7HowToStart() {
  return (
    <div
      dir="rtl"
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "linear-gradient(160deg, #1F6E54 0%, #164E3C 100%)" }}
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
          top: "8vh",
          right: "7vw",
        }}
      >
        <div
          style={{
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "2.2vw",
            fontWeight: "400",
            color: "#CFE0D3",
          }}
        >
          كيف تبدأ
        </div>
        <div
          style={{
            marginTop: "1vh",
            fontFamily: "Amiri, Georgia, serif",
            fontSize: "5.5vw",
            fontWeight: "700",
            color: "#FAF5EA",
            lineHeight: 1.2,
            textWrap: "balance",
          }}
        >
          ثلاث خطوات
          <span style={{ display: "block", color: "#B08D2E" }}>للبدء</span>
        </div>
        <div
          style={{
            marginTop: "1.5vh",
            width: "5vw",
            height: "0.2vh",
            background: "#B08D2E",
          }}
        />
      </div>

      <div
        className="absolute"
        style={{
          top: "48vh",
          right: "7vw",
          left: "7vw",
          display: "flex",
          gap: "3vw",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            flex: 1,
            background: "rgba(250,245,234,0.08)",
            borderRadius: "0.5vw",
            padding: "3vh 2.5vw",
            borderTop: "0.35vh solid #B08D2E",
          }}
        >
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "5vw",
              fontWeight: "700",
              color: "#B08D2E",
              lineHeight: 1,
            }}
          >
            ١
          </div>
          <div
            style={{
              marginTop: "1.5vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.8vw",
              fontWeight: "700",
              color: "#FAF5EA",
              lineHeight: 1.3,
            }}
          >
            أنشئ حسابك
          </div>
          <div
            style={{
              marginTop: "1vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "300",
              color: "#CFE0D3",
              lineHeight: 1.5,
            }}
          >
            سجّل باستخدام بريدك الإلكتروني في ثوانٍ
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "rgba(250,245,234,0.08)",
            borderRadius: "0.5vw",
            padding: "3vh 2.5vw",
            borderTop: "0.35vh solid #B08D2E",
          }}
        >
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "5vw",
              fontWeight: "700",
              color: "#B08D2E",
              lineHeight: 1,
            }}
          >
            ٢
          </div>
          <div
            style={{
              marginTop: "1.5vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.8vw",
              fontWeight: "700",
              color: "#FAF5EA",
              lineHeight: 1.3,
            }}
          >
            اكتشف الدروس
          </div>
          <div
            style={{
              marginTop: "1vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "300",
              color: "#CFE0D3",
              lineHeight: 1.5,
            }}
          >
            تصفّح الدروس والمشايخ والمكتبة
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "rgba(250,245,234,0.08)",
            borderRadius: "0.5vw",
            padding: "3vh 2.5vw",
            borderTop: "0.35vh solid #B08D2E",
          }}
        >
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "5vw",
              fontWeight: "700",
              color: "#B08D2E",
              lineHeight: 1,
            }}
          >
            ٣
          </div>
          <div
            style={{
              marginTop: "1.5vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.8vw",
              fontWeight: "700",
              color: "#FAF5EA",
              lineHeight: 1.3,
            }}
          >
            شارك وتفاعل
          </div>
          <div
            style={{
              marginTop: "1vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "300",
              color: "#CFE0D3",
              lineHeight: 1.5,
            }}
          >
            سجّل في الدروس وشارك الفوائد مع المجتمع
          </div>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "5vh",
          left: "7vw",
          fontFamily: "Almarai, Tahoma, sans-serif",
          fontSize: "2vw",
          fontWeight: "700",
          color: "rgba(207,224,211,0.35)",
        }}
      >
        Majalis Al-Ilm
      </div>
    </div>
  );
}
