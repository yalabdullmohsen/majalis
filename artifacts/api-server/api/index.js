let appPromise;

export default async function handler(req, res) {
  appPromise ||= import("../dist/app.mjs").then((mod) => mod.default);
  const app = await appPromise;
  return app(req, res);
}
