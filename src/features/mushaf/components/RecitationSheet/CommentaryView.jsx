/**
 * src/features/mushaf/components/RecitationSheet/CommentaryView.jsx
 * عرض التفسير
 */

import React from 'react';

export const CommentaryView = ({
  verse,
  commentator,
  onCommentatorChange,
  isDetailed,
  onDetailedChange,
  fontSize,
  onFontSizeChange,
  isDarkMode = false,
}) => {
  const commentators = [
    { id: 'tabari', name: 'تفسير الطبري' },
    { id: 'qurtubi', name: 'تفسير القرطبي' },
    { id: 'ibn-kathir', name: 'تفسير ابن كثير' },
  ];

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: 12, color: isDarkMode ? '#999' : '#666' }}>
          المفسّر:
        </label>
        <select
          value={commentator}
          onChange={e => onCommentatorChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 4,
            border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`,
            backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0',
            color: isDarkMode ? '#fff' : '#000',
            marginTop: '4px',
            minHeight: 44,
          }}
        >
          {commentators.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => onDetailedChange(false)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 4,
            border: 'none',
            backgroundColor: !isDetailed ? '#D4AF37' : (isDarkMode ? '#2a2a2a' : '#e0e0e0'),
            color: !isDetailed ? '#fff' : (isDarkMode ? '#fff' : '#000'),
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          مختصر
        </button>
        <button
          onClick={() => onDetailedChange(true)}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 4,
            border: 'none',
            backgroundColor: isDetailed ? '#D4AF37' : (isDarkMode ? '#2a2a2a' : '#e0e0e0'),
            color: isDetailed ? '#fff' : (isDarkMode ? '#fff' : '#000'),
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          مطول
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: 12, color: isDarkMode ? '#999' : '#666' }}>
          حجم الخط: {fontSize}px
        </label>
        <input
          type="range"
          min="14"
          max="24"
          value={fontSize}
          onChange={e => onFontSizeChange(parseInt(e.target.value))}
          style={{
            width: '100%',
            marginTop: '4px',
            accentColor: '#D4AF37',
            minHeight: 20,
          }}
        />
      </div>

      <div
        style={{
          fontSize: fontSize,
          lineHeight: 1.9,
          color: isDarkMode ? '#e0e0e0' : '#333',
          padding: '12px',
          backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9',
          borderRadius: 8,
          marginBottom: '12px',
        }}
      >
        {verse ? `تفسير الآية ${verse.verseNumber}` : 'اختر آية'}
      </div>

      <div
        style={{
          fontSize: 11,
          color: isDarkMode ? '#999' : '#999',
          fontStyle: 'italic',
          textAlign: 'right',
        }}
      >
        المصدر: {commentator}
      </div>
    </div>
  );
};

export default CommentaryView;
