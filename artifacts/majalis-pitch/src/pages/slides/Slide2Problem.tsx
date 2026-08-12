export default function Slide2Problem() {
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
          height: "0.5vh",
          background: "linear-gradient(90deg, #FAF5EA 0%, #1F6E54 50%, #B08D2E 100%)",
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
            fontWeight: "700",
            color: "#B08D2E",
            letterSpacing: "0.05em",
          }}
        >
          التحدي
        </div>
        <div
          style={{
            fontFamily: "Amiri, Georgia, serif",
            fontSize: "5.5vw",
            fontWeight: "700",
            color: "#241F18",
            lineHeight: 1.2,
            textWrap: "balance",
          }}
        >
          طلب العلم الشرعي
          <span style={{ display: "block", color: "#1F6E54" }}>
            يواجه عقبات
          </span>
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
          top: "44vh",
          right: "7vw",
          left: "7vw",
          display: "flex",
          flexDirection: "row",
          gap: "2.5vw",
        }}
      >
        <div
          style={{
            flex: 1,
            background: "#F0E8D6",
            borderRadius: "0.5vw",
            padding: "3.5vh 2.5vw",
            borderTop: "0.4vh solid #1F6E54",
          }}
        >
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "3.8vw",
              fontWeight: "700",
              color: "#1F6E54",
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
              color: "#241F18",
              lineHeight: 1.3,
              textWrap: "balance",
            }}
          >
            المحتوى مبعثر
          </div>
          <div
            style={{
              marginTop: "1.2vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.5,
            }}
          >
            الدروس والكتب والفوائد في منصات متعددة بلا تنظيم
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "#F0E8D6",
            borderRadius: "0.5vw",
            padding: "3.5vh 2.5vw",
            borderTop: "0.4vh solid #1F6E54",
          }}
        >
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "3.8vw",
              fontWeight: "700",
              color: "#1F6E54",
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
              color: "#241F18",
              lineHeight: 1.3,
              textWrap: "balance",
            }}
          >
            صعوبة التحقق
          </div>
          <div
            style={{
              marginTop: "1.2vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.5,
            }}
          >
            لا طريقة سهلة للتأكد من علمية الشيخ وموثوقيته
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "#F0E8D6",
            borderRadius: "0.5vw",
            padding: "3.5vh 2.5vw",
            borderTop: "0.4vh solid #B08D2E",
          }}
        >
          <div
            style={{
              fontFamily: "Amiri, Georgia, serif",
              fontSize: "3.8vw",
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
              color: "#241F18",
              lineHeight: 1.3,
              textWrap: "balance",
            }}
          >
            غياب التفاعل
          </div>
          <div
            style={{
              marginTop: "1.2vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.5,
            }}
          >
            لا آلية لمتابعة الدروس والتسجيل ومشاركة الفوائد
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
          letterSpacing: "0.05em",
        }}
      >
        مجالس العلم
      </div>
    </div>
  );
}
