export default function Slide8Closing() {
  return (
    <div
      dir="rtl"
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "linear-gradient(150deg, #FAF5EA 0%, #F0E8D6 60%, #e8dcc2 100%)" }}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{ width: "0.6vw", background: "#1F6E54" }}
      />

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
          top: "50%",
          right: "50%",
          transform: "translate(50%, -50%)",
          width: "80vw",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "2.2vw",
            fontWeight: "400",
            color: "#B08D2E",
            letterSpacing: "0.08em",
          }}
        >
          انضم إلينا
        </div>
        <div
          style={{
            marginTop: "2vh",
            fontFamily: "Amiri, Georgia, serif",
            fontSize: "9vw",
            fontWeight: "700",
            color: "#1F6E54",
            lineHeight: 1.05,
            textWrap: "balance",
          }}
        >
          مجالس
        </div>
        <div
          style={{
            margin: "2vh auto 0",
            width: "8vw",
            height: "0.25vh",
            background: "#B08D2E",
          }}
        />
        <div
          style={{
            marginTop: "3vh",
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "3vw",
            fontWeight: "400",
            color: "#5B5446",
            lineHeight: 1.5,
            textWrap: "pretty",
          }}
        >
          المنصة العلمية الشرعية
        </div>
        <div
          style={{
            marginTop: "1.5vh",
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "2.5vw",
            fontWeight: "300",
            color: "#5B5446",
            lineHeight: 1.5,
          }}
        >
          دروس · مشايخ · مكتبة · فوائد
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "6vh",
          right: "50%",
          transform: "translateX(50%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "2.2vw",
            fontWeight: "300",
            color: "#5B5446",
          }}
        >
          majalis
        </div>
      </div>
    </div>
  );
}
