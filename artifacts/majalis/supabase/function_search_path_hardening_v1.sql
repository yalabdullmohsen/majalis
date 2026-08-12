-- ════════════════════════════════════════════════════════════════════════
-- Function search_path Hardening v1 — إغلاق تحذير Security Advisor
-- (function_search_path_mutable)
-- ════════════════════════════════════════════════════════════════════════
--
-- المشكلة: 42 دالة في مخطط public (21 منها SECURITY DEFINER — أعلى خطورة)
-- بلا search_path صريح. الدوال التي تُنفَّذ بصلاحيات مالكها (SECURITY DEFINER)
-- عرضة لهجوم "search_path hijacking": إن استطاع مهاجم التأثير على search_path
-- لجلسة الاستدعاء (مثلًا عبر إنشاء دالة/جدول بنفس الاسم في مخطط يسبق public
-- في المسار)، قد تُنفَّذ الدالة كائنات مزيَّفة بدل الحقيقية، فتُنفَّذ بصلاحيات
-- مالك الدالة (غالبًا postgres) بدل صلاحيات المُستدعي الفعلي — تصعيد صلاحيات.
--
-- الإصلاح: تثبيت search_path صراحةً لكل دالة على 'public' فقط — يمنع أي
-- إعادة تعريف من مخطط آخر يسبقه في المسار، دون تغيير أي سلوك فعلي (كل هذه
-- الدوال مُعرَّفة أصلًا داخل public وتشير لكائنات public).
--
-- استُبعدت دوال امتداد pg_trgm (gtrgm_*, similarity, word_similarity, ...)
-- لأنها مملوكة للامتداد نفسه ولا تُعدَّل يدويًا، وليست خطر تصعيد صلاحيات
-- بنفس الدرجة (لا SECURITY DEFINER بمنطق تطبيقي).
--
-- idempotent بالكامل: ALTER FUNCTION ... SET search_path يُستبدَل بأمان
-- عند إعادة التشغيل بلا خطأ.
--
-- التشغيل: npx supabase db query --linked --file supabase/function_search_path_hardening_v1.sql
-- ════════════════════════════════════════════════════════════════════════

ALTER FUNCTION public.ake_engine_stats(integer) SET search_path = public;
ALTER FUNCTION public.autonomous_platform_stats(integer) SET search_path = public;
ALTER FUNCTION public.calculate_lesson_quality_score(uuid) SET search_path = public;
ALTER FUNCTION public.generate_citation_slug() SET search_path = public;
ALTER FUNCTION public.get_node_subgraph(uuid,integer) SET search_path = public;
ALTER FUNCTION public.get_published_auto_content(integer,text) SET search_path = public;
ALTER FUNCTION public.get_published_auto_content_by_slug(text) SET search_path = public;
ALTER FUNCTION public.get_related_content(text,text,integer) SET search_path = public;
ALTER FUNCTION public.get_related_entities(text,text,integer) SET search_path = public;
ALTER FUNCTION public.get_similar_users(uuid,integer) SET search_path = public;
ALTER FUNCTION public.get_submission_stats() SET search_path = public;
ALTER FUNCTION public.global_reference_stats() SET search_path = public;
ALTER FUNCTION public.governance_platform_stats() SET search_path = public;
ALTER FUNCTION public.intelligence_platform_stats(integer) SET search_path = public;
ALTER FUNCTION public.kg_phase4_stats() SET search_path = public;
ALTER FUNCTION public.knowledge_normalize_text(text) SET search_path = public;
ALTER FUNCTION public.knowledge_pipeline_stats(integer) SET search_path = public;
ALTER FUNCTION public.learning_platform_stats() SET search_path = public;
ALTER FUNCTION public.match_knowledge_embeddings(vector,integer,double precision) SET search_path = public;
ALTER FUNCTION public.normalize_ar(text) SET search_path = public;
ALTER FUNCTION public.open_platform_stats(integer) SET search_path = public;
ALTER FUNCTION public.populate_search_index_from_all() SET search_path = public;
ALTER FUNCTION public.reasoning_engine_stats() SET search_path = public;
ALTER FUNCTION public.record_lesson_view(uuid) SET search_path = public;
ALTER FUNCTION public.refresh_lesson_quality(uuid,text) SET search_path = public;
ALTER FUNCTION public.review_lesson_quality(uuid,text,text,text) SET search_path = public;
ALTER FUNCTION public.search_analytics_summary(integer) SET search_path = public;
ALTER FUNCTION public.search_knowledge_hybrid(text,integer) SET search_path = public;
ALTER FUNCTION public.search_scholarly_content(text,text,text,text,text,text,date,date,integer) SET search_path = public;
ALTER FUNCTION public.search_unified_rag(text,text[],integer) SET search_path = public;
ALTER FUNCTION public.search_unified_rag_partial(text,text[],integer) SET search_path = public;
ALTER FUNCTION public.set_kn_nodes_updated_at() SET search_path = public;
ALTER FUNCTION public.set_kr_updated_at() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.sharia_rulings_search_vector_update() SET search_path = public;
ALTER FUNCTION public.sync_lesson_avg_rating() SET search_path = public;
ALTER FUNCTION public.update_citation_sources_updated_at() SET search_path = public;
ALTER FUNCTION public.update_islamic_stories_updated_at() SET search_path = public;
ALTER FUNCTION public.update_lesson_rating_updated_at() SET search_path = public;
ALTER FUNCTION public.update_muezzin_rating() SET search_path = public;
ALTER FUNCTION public.update_prophet_stories_updated_at() SET search_path = public;
ALTER FUNCTION public.upsert_user_interest(uuid,uuid,numeric) SET search_path = public;
