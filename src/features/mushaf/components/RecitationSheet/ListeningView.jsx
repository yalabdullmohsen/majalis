/**
 * src/features/mushaf/components/RecitationSheet/ListeningView.jsx
 */
export const ListeningView = ({ verse, currentReader, onReaderChange, isDarkMode = false }) => (
  <div style={{ direction: 'rtl', padding: '12px' }}>
    <h3 style={{ color: isDarkMode ? '#fff' : '#000', marginBottom: '12px' }}>الاستماع</h3>
    <p style={{ color: isDarkMode ? '#999' : '#666' }}>استماع الآية {verse?.verseNumber}</p>
  </div>
);
export default ListeningView;
