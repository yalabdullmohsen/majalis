import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const ALLOWED_ORIGINS = [
  "https://majlisilm.com",
  "https://www.majlisilm.com",
];

app.use(
  cors({
    origin(origin, callback) {
      // لا رأس Origin (طلبات من خادم لخادم، أو curl، أو تطبيق الجوال عبر
      // Capacitor الذي لا يرسل Origin دائمًا) — نسمح، فهذه ليست طلبات متصفح
      // متعددة المصادر أصلاً.
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // false (لا Error) يجعل مكتبة cors تُسقط رؤوس CORS بهدوء فيرفض
      // المتصفح الطلب من جهته — بدل رمي خطأ يتحوّل إلى 500 مضلِّل في السجلات.
      return callback(null, false);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
