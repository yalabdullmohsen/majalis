/**
 * src/features/mushaf/components/RecitationSheet/MoreMenu.jsx
 */
export const MoreMenu = ({ verse, onAction, isDarkMode = false }) => {
  const actions = [
    { id: 'copy', label: '📋 نسخ' },
    { id: 'share', label: '🔗 مشاركة' },
    { id: 'bookmark', label: '🔖 إضافة إشارة' },
  ];

  return (
    <div style={{ direction: 'rtl', padding: '12px' }}>
      <h3 style={{ color: isDarkMode ? '#fff' : '#000', marginBottom: '12px' }}>المزيد</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => onAction(action.id, verse)}
            style={{
              padding: '12px',
              backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0',
              border: 'none',
              borderRadius: 8,
              color: isDarkMode ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: 14,
              minHeight: 44,
              textAlign: 'right',
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};
export default MoreMenu;
