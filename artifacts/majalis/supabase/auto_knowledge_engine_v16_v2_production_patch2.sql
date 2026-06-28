-- AKE v16 production patch 2 — enable auto_publish on Kuwait lesson Instagram sources (idempotent)

UPDATE ake_connectors SET
  auto_publish = true,
  trust_level = GREATEST(trust_level, 4),
  is_active = true,
  updated_at = now()
WHERE slug IN (
  'ig-drooss-kw', 'ig-othmanalkamees', 'ig-ibnabitallib', 'ig-masjedalmehry',
  'ig-warathakw2', 'ig-mpe-kh11', 'ig-masjedalansary', 'ig-moudhi-mosque',
  'ig-alshalahi-masjid', 'ig-alshalahi-women', 'ig-mhamadh-kw', 'ig-dr-hayaalsabah',
  'ig-shariakuniv', 'ig-nadwat2025', 'ig-kwt-awqaf',
  'web-drhayaalsabah', 'web-othmanalkamees', 'web-awqaf-kw'
);
