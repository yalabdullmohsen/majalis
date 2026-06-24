export default function Slide4Lessons() {
  return (
    <div
      dir="rtl"
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#FAF5EA" }}
    >
      <div
        className="absolute inset-y-0 right-0"
        style={{ width: "48vw", background: "#F0E8D6" }}
      />

      <div
        className="absolute inset-y-0"
        style={{ right: "48vw", width: "0.3vw", background: "#B08D2E" }}
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
          right: "50vw",
          transform: "translateY(-50%)",
          width: "44vw",
          paddingLeft: "6vw",
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
          الدروس
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
          تصفّح وسجّل
          <span style={{ display: "block", color: "#1F6E54" }}>
            في الدروس
          </span>
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
          ابحث عن الدروس الشرعية حسب المدينة أو التخصص، وسجّل حضورك مباشرة من المنصة
        </div>
      </div>

      <div
        className="absolute"
        style={{
          top: "50%",
          right: "4vw",
          transform: "translateY(-50%)",
          width: "40vw",
          display: "flex",
          flexDirection: "column",
          gap: "2.5vh",
        }}
      >
        <div
          style={{
            background: "#FAF5EA",
            borderRadius: "0.5vw",
            padding: "2.5vh 2.5vw",
            borderRight: "0.4vw solid #1F6E54",
          }}
        >
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.8vw",
              fontWeight: "700",
              color: "#241F18",
            }}
          >
            فلترة متقدمة
          </div>
          <div
            style={{
              marginTop: "0.8vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.4,
            }}
          >
            حسب المنطقة، التصنيف، والشيخ
          </div>
        </div>

        <div
          style={{
            background: "#FAF5EA",
            borderRadius: "0.5vw",
            padding: "2.5vh 2.5vw",
            borderRight: "0.4vw solid #1F6E54",
          }}
        >
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.8vw",
              fontWeight: "700",
              color: "#241F18",
            }}
          >
            تسجيل الحضور
          </div>
          <div
            style={{
              marginTop: "0.8vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.4,
            }}
          >
            للمستخدمين المسجّلين مباشرة من الصفحة
          </div>
        </div>

        <div
          style={{
            background: "#FAF5EA",
            borderRadius: "0.5vw",
            padding: "2.5vh 2.5vw",
            borderRight: "0.4vw solid #B08D2E",
          }}
        >
          <div
            style={{
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.8vw",
              fontWeight: "700",
              color: "#241F18",
            }}
          >
            تفاصيل الدرس
          </div>
          <div
            style={{
              marginTop: "0.8vh",
              fontFamily: "Almarai, Tahoma, sans-serif",
              fontSize: "2.2vw",
              fontWeight: "400",
              color: "#5B5446",
              lineHeight: 1.4,
            }}
          >
            الموعد، الموقع، والشيخ المحاضر
          </div>
        </div>
      </div>

      <div
        className="absolute"
        style={{
          bottom: "4vh",
          left: "4vw",
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
