export default function Slide5Sheikhs() {
  return (
    <div
      dir="rtl"
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#FAF5EA" }}
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
          top: "7vh",
          right: "7vw",
        }}
      >
        <div
          style={{
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "2.2vw",
            fontWeight: "700",
            color: "#B08D2E",
          }}
        >
          المشايخ
        </div>
        <div
          style={{
            marginTop: "1vh",
            fontFamily: "Amiri, Georgia, serif",
            fontSize: "5.5vw",
            fontWeight: "700",
            color: "#241F18",
            lineHeight: 1.15,
            textWrap: "balance",
          }}
        >
          مشايخ معتمدون
          <span style={{ display: "block", color: "#1F6E54" }}>بملفات موثّقة</span>
        </div>
        <div
          style={{
            marginTop: "1vh",
            width: "6vw",
            height: "0.2vh",
            background: "#B08D2E",
          }}
        />
      </div>

      <div
        className="absolute"
        style={{
          top: "46vh",
          right: "7vw",
          left: "7vw",
          display: "flex",
          gap: "3vw",
        }}
      >
        <div
          style={{
            flex: 1,
            background: "#F0E8D6",
            borderRadius: "0.5vw",
            padding: "3vh 2.5vw",
            display: "flex",
            flexDirection: "column",
            gap: "1.2vh",
          }}
        >
          <div
            style={{
              width: "5vw",
              height: "5vw",
              borderRadius: "50%",
              background: "#1F6E54",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Amiri, Georgia, serif",
                fontSize: "2.5vw",
                fontWeight: "700",
                color: "#FAF5EA",
              }}
            >
              م
            </div>
          </div>
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.8vw",
              fontWeight: "700",
              color: "#241F18",
            }}
          >
            ملف شخصي كامل
          </div>
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.5,
            }}
          >
            المؤهلات والتخصصات وسيرة الشيخ
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "#F0E8D6",
            borderRadius: "0.5vw",
            padding: "3vh 2.5vw",
            display: "flex",
            flexDirection: "column",
            gap: "1.2vh",
          }}
        >
          <div
            style={{
              width: "5vw",
              height: "5vw",
              borderRadius: "50%",
              background: "#1F6E54",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Amiri, Georgia, serif",
                fontSize: "2.5vw",
                fontWeight: "700",
                color: "#FAF5EA",
              }}
            >
              د
            </div>
          </div>
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.8vw",
              fontWeight: "700",
              color: "#241F18",
            }}
          >
            دروس الشيخ
          </div>
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.5,
            }}
          >
            جميع دروسه في صفحة واحدة مع إمكانية التسجيل
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "#F0E8D6",
            borderRadius: "0.5vw",
            padding: "3vh 2.5vw",
            display: "flex",
            flexDirection: "column",
            gap: "1.2vh",
          }}
        >
          <div
            style={{
              width: "5vw",
              height: "5vw",
              borderRadius: "50%",
              background: "#B08D2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Amiri, Georgia, serif",
                fontSize: "2.5vw",
                fontWeight: "700",
                color: "#FAF5EA",
              }}
            >
              و
            </div>
          </div>
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.8vw",
              fontWeight: "700",
              color: "#241F18",
            }}
          >
            مشايخ موثوقون
          </div>
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.5,
            }}
          >
            قائمة مشايخ معتمدة ومراجعة من الفريق
          </div>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "4vh",
          left: "7vw",
          fontFamily: "Almarai, Tahoma, sans-serif",
          fontSize: "2vw",
          fontWeight: "700",
          color: "#CFE0D3",
        }}
      >
        مجالس
      </div>
    </div>
  );
}
