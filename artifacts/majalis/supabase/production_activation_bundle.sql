-- Production Activation Bundle — run in Supabase SQL Editor (single paste)
-- Order: QA fix → sharia prereq → sharia encyclopedia → MKE v1 → MKE v2
-- Project: ngmvmlulzacrlicuagyp

\echo '1/5 qa_categories_fix_v1'
\i qa_categories_fix_v1.sql

\echo '2/5 sharia_rulings_prereq'
\i sharia_rulings_prereq.sql

\echo '3/5 sharia_rulings_encyclopedia_v1'
\i sharia_rulings_encyclopedia_v1.sql

\echo '4/5 majlis_knowledge_engine_v1'
\i majlis_knowledge_engine_v1.sql

\echo '5/5 majlis_knowledge_engine_v2'
\i majlis_knowledge_engine_v2.sql
