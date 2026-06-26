/**
 * Certificate generation — verification codes, QR data.
 */

import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { localGet, localSet, getLocalUserId } from "./storage.mjs";
import { getPathBySlug } from "./paths-seed.mjs";

function generateCode() {
  return `MJLS-${randomBytes(4).toString("hex").toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

export async function issueCertificate(admin, userId, { pathSlug, scorePct, userName }) {
  const path = getPathBySlug(pathSlug);
  if (!path) return { ok: false, error: "path_not_found" };

  const code = generateCode();
  const qrData = JSON.stringify({
    code,
    path: pathSlug,
    title: path.title,
    issued: new Date().toISOString(),
    verify: `/learning/certificates/${code}`,
  });

  const cert = {
    certificate_code: code,
    path_slug: pathSlug,
    title: `شهادة إتمام مسار ${path.title}`,
    score_pct: scorePct || 100,
    issued_at: new Date().toISOString(),
    qr_data: qrData,
    user_name: userName || "طالب علم",
  };

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      const { data } = await admin
        .from("learning_certificates")
        .insert({
          user_id: userId,
          path_id: pathSlug,
          certificate_code: code,
          title: cert.title,
          score_pct: scorePct,
          qr_data: qrData,
        })
        .select()
        .single();
      if (data) return { ok: true, certificate: { ...cert, id: data.id }, source: "supabase" };
    } catch {
      /* fallback */
    }
  }

  const uid = userId || getLocalUserId();
  const certs = localGet(`certificates_${uid}`, []);
  certs.push(cert);
  localSet(`certificates_${uid}`, certs);

  return { ok: true, certificate: cert, source: "local" };
}

export async function verifyCertificate(admin, code) {
  if (admin) {
    try {
      const { data } = await admin
        .from("learning_certificates")
        .select("*, learning_paths(slug, title)")
        .eq("certificate_code", code)
        .maybeSingle();
      if (data) return { ok: true, valid: true, certificate: data, source: "supabase" };
    } catch {
      /* fallback */
    }
  }

  return { ok: true, valid: false, message: "تحقق من الرقم أو سجّل الدخول" };
}

export async function getUserCertificates(admin, userId) {
  const uid = userId || getLocalUserId();

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      const { data } = await admin
        .from("learning_certificates")
        .select("*")
        .eq("user_id", userId)
        .order("issued_at", { ascending: false });
      if (data?.length) return data;
    } catch {
      /* fallback */
    }
  }

  return localGet(`certificates_${uid}`, []);
}
