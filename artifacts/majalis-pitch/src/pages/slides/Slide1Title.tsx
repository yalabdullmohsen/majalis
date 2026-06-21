export default function Slide1Title() {
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
          top: "0",
          right: "0",
          width: "28vw",
          height: "100%",
          background: "linear-gradient(180deg, #1F6E54 0%, #164E3C 100%)",
        }}
      />

      <div
        className="absolute"
        style={{
          top: "0",
          right: "28vw",
          width: "0.3vw",
          height: "100%",
          background: "#B08D2E",
        }}
      />

      <div
        className="absolute"
        style={{
          top: "12vh",
          right: "5vw",
          width: "18vw",
        }}
      >
        <div
          style={{
            fontFamily: "Amiri, Georgia, serif",
            fontSize: "3.5vw",
            fontWeight: "700",
            color: "#FAF5EA",
            lineHeight: 1.3,
            textAlign: "right",
            textWrap: "balance",
          }}
        >
          مجالس
        </div>
        <div
          style={{
            marginTop: "1vh",
            width: "6vw",
            height: "0.2vh",
            background: "#B08D2E",
          }}
        />
        <div
          style={{
            marginTop: "2.5vh",
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "1.5vw",
            fontWeight: "300",
            color: "#CFE0D3",
            lineHeight: 1.6,
            textAlign: "right",
          }}
        >
          المنصة العلمية الشرعية
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "8vh",
          right: "5vw",
          width: "18vw",
        }}
      >
        <div
          style={{
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "1.3vw",
            fontWeight: "300",
            color: "rgba(250,245,234,0.55)",
            textAlign: "right",
          }}
        >
          ١٤٤٧ هـ
        </div>
      </div>

      <div
        className="absolute"
        style={{
          top: "50%",
          right: "35vw",
          transform: "translateY(-50%)",
          width: "55vw",
          paddingLeft: "6vw",
        }}
      >
        <div
          style={{
            fontFamily: "Amiri, Georgia, serif",
            fontSize: "8.5vw",
            fontWeight: "700",
            color: "#1F6E54",
            lineHeight: 1.1,
            textAlign: "right",
            textWrap: "balance",
          }}
        >
          العلم في
          <span style={{ display: "block", color: "#B08D2E" }}>متناولك</span>
        </div>
        <div
          style={{
            marginTop: "2vh",
            width: "8vw",
            height: "0.25vh",
            background: "#B08D2E",
            marginRight: "0",
            marginLeft: "auto",
          }}
        />
        <div
          style={{
            marginTop: "3vh",
            fontFamily: "Almarai, Tahoma, sans-serif",
            fontSize: "2.8vw",
            fontWeight: "400",
            color: "#5B5446",
            lineHeight: 1.5,
            textAlign: "right",
            textWrap: "pretty",
          }}
        >
          دروس شرعية، مشايخ معتمدون،
          <span style={{ display: "block" }}>
            مكتبة علمية — في مكان واحد
          </span>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "6vh",
          left: "6vw",
          fontFamily: "Almarai, Tahoma, sans-serif",
          fontSize: "2.2vw",
          fontWeight: "700",
          color: "#1F6E54",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        majalis
      </div>
    </div>
  );
}
