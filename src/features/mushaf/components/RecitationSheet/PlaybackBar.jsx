/**
 * src/features/mushaf/components/RecitationSheet/PlaybackBar.jsx
 * 
 * شريط التشغيل الحديث
 * 
 * المكونات:
 * - زر تشغيل/إيقاف دائري كبير
 * - شريط تقدّم قابل للسحب
 * - الزمن المنقضي / المتبقي
 * - اختيار السرعة (0.75× – 2×)
 * - اختيار التكرار (1× / 3× / ∞)
 * - اختيار القارئ (dropdown قابل للبحث)
 * - زر التنزيل للاستماع دون اتصال
 */

import React, { useState } from 'react';

/**
 * @component PlaybackBar
 */
export const PlaybackBar = ({
  isPlaying,
  onPlayPause,
  currentTime,
  duration,
  onSeek,
  playbackSpeed,
  onSpeedChange,
  repeatMode,
  onRepeatChange,
  currentReader,
  onReaderChange,
  isDarkMode = false,
}) => {
  const [showReaderList, setShowReaderList] = useState(false);

  // قائمة القراء
  const readers = [
    { id: 'abdul-basit', name: 'عبدالباسط عبدالصمد' },
    { id: 'minshawi', name: 'محمود خليل الحصري' },
    { id: 'parhizgar', name: 'علي الحذيفي' },
    // ... more readers
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const repeatModeLabel = {
    1: '1×',
    3: '3×',
    Infinity: '∞',
  };

  return (
    <div
      className="playback-bar"
      style={{
        padding: '16px',
        backgroundColor: isDarkMode ? '#1a1a1a' : '#fafafa',
        borderBottom: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
        direction: 'rtl',
      }}
    >
      {/* شريط التقدّم */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={e => onSeek(parseFloat(e.target.value))}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: '#D4AF37',
            minHeight: 20, // accessibility
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: isDarkMode ? '#999' : '#666',
            marginTop: '4px',
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* التحكمات الرئيسية */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr 44px 44px 44px 44px',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        {/* زر التكرار */}
        <button
          onClick={() => {
            const next = repeatMode === 1 ? 3 : repeatMode === 3 ? Infinity : 1;
            onRepeatChange(next);
          }}
          style={{
            padding: '10px',
            minWidth: 44,
            minHeight: 44,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isDarkMode ? '#2a2a2a' : '#e0e0e0',
            color: repeatMode === 1 ? (isDarkMode ? '#999' : '#666') : '#D4AF37',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
          }}
          title="تكرار"
        >
          {repeatModeLabel[repeatMode]}
        </button>

        {/* اسم القارئ (قابل للنقر للتبديل) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowReaderList(!showReaderList)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 20,
              border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`,
              backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0',
              color: isDarkMode ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minHeight: 44,
            }}
          >
            {readers.find(r => r.id === currentReader)?.name || 'اختر القارئ'}
          </button>

          {/* Dropdown قائمة القراء */}
          {showReaderList && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`,
                borderRadius: 8,
                zIndex: 1000,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {readers.map(reader => (
                <button
                  key={reader.id}
                  onClick={() => {
                    onReaderChange(reader.id);
                    setShowReaderList(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    backgroundColor: reader.id === currentReader 
                      ? (isDarkMode ? '#333' : '#f0f0f0')
                      : 'transparent',
                    color: isDarkMode ? '#fff' : '#000',
                    textAlign: 'right',
                    cursor: 'pointer',
                    fontSize: 13,
                    minHeight: 44,
                  }}
                >
                  {reader.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* زر السرعة */}
        <button
          onClick={() => {
            const speeds = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
            const currentIdx = speeds.indexOf(playbackSpeed);
            const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
            onSpeedChange(nextSpeed);
          }}
          style={{
            padding: '10px',
            minWidth: 44,
            minHeight: 44,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isDarkMode ? '#2a2a2a' : '#e0e0e0',
            color: isDarkMode ? '#fff' : '#000',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
          }}
          title="السرعة"
        >
          {playbackSpeed.toFixed(2)}×
        </button>

        {/* زر التشغيل الرئيسي (دائري كبير) */}
        <button
          onClick={onPlayPause}
          style={{
            gridColumn: 'span 2',
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#D4AF37',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 20,
            fontWeight: 'bold',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          title={isPlaying ? 'إيقاف' : 'تشغيل'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* زر التنزيل */}
        <button
          style={{
            padding: '10px',
            minWidth: 44,
            minHeight: 44,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isDarkMode ? '#2a2a2a' : '#e0e0e0',
            color: isDarkMode ? '#fff' : '#000',
            cursor: 'pointer',
            fontSize: 16,
            transition: 'background-color 0.2s',
          }}
          title="تنزيل للاستماع دون اتصال"
        >
          ↓
        </button>
      </div>
    </div>
  );
};

export default PlaybackBar;
