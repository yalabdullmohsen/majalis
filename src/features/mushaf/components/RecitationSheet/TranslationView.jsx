/**
 * src/features/mushaf/components/RecitationSheet/TranslationView.jsx
 */
export const TranslationView = ({ verse, isDarkMode = false }) => (
  <div style={{ direction: 'rtl', padding: '12px' }}>
    <h3 style={{ color: isDarkMode ? '#fff' : '#000', marginBottom: '12px' }}>الترجمة</h3>
    {verse ? (
      <div style={{ fontSize: 16, lineHeight: 1.8, color: isDarkMode ? '#e0e0e0' : '#333', padding: '12px', backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9', borderRadius: 8 }}>
        ترجمة الآية {verse.verseNumber}
      </div>
    ) : (
      <p>اختر آية</p>
    )}
  </div>
);
export default TranslationView;
