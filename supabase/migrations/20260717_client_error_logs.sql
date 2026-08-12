-- =====================================================================
--  سجل أخطاء العميل — دائم بدل الذاكرة المؤقتة
--  التاريخ: 2026-07-17
--
--  lib/api-handlers/client-error-log.js كان يخزّن التقارير في Map()
--  داخل الذاكرة فقط — على Vercel serverless لا يضمن بقاء نفس نسخة
--  العملية بين الطلبات (cold start/تعدد نسخ)، فيفقد التقرير عمليًا
--  ولا يمكن استرجاعه لاحقًا بمعرّف الخطأ في أغلب الأحيان. هذا الجدول
--  يجعل السجل دائمًا وقابلاً للعرض في لوحة جودة إدارية.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.client_error_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id        text NOT NULL,
  message         text NOT NULL,
  name            text,
  stack           text,
  component_stack text,
  component       text,
  route           text,
  section         text,
  user_agent      text,
  user_id         text,
  user_action     text,
  build_version   text,
  commit_hash     text,
  device_type     text,
  api_response    text,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_error_logs_error_id ON public.client_error_logs(error_id);
CREATE INDEX IF NOT EXISTS idx_client_error_logs_created_at ON public.client_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_error_logs_route ON public.client_error_logs(route);

ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_error_logs_admin_read" ON public.client_error_logs;
CREATE POLICY "client_error_logs_admin_read" ON public.client_error_logs
  FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "client_error_logs_service_write" ON public.client_error_logs;
CREATE POLICY "client_error_logs_service_write" ON public.client_error_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
