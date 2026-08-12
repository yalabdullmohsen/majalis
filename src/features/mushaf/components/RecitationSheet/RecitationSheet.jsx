/**
 * src/features/mushaf/components/RecitationSheet/RecitationSheet.jsx
 * 
 * شيت التلاوة والتفسير الحديث
 * 
 * المواصفات:
 * - شيت سفلي بنقاط التصاق (snap points): ٤٥٪ و٩٢٪
 * - مقبض سحب مرئي
 * - تبويبات مقسّمة: التفسير · الترجمة · الاستماع · المزيد
 * - شريط تلاوة حديث ثابت أسفل الشيت
 * - تشغيل متسلسل آية بآية مع تظليل
 * - ناقل صوت حصري
 * - وضع ليلي كامل (contrast ≥ 4.5:1)
 * - مساحات لمس ≥ 44px
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BottomSheet, BottomSheetHandle } from './BottomSheet';
import { PlaybackBar } from './PlaybackBar';
import { CommentaryView } from './CommentaryView';
import { TranslationView } from './TranslationView';
import { ListeningView } from './ListeningView';
import { MoreMenu } from './MoreMenu';

/**
 * @component RecitationSheet
 * @param {Object} currentVerse - { pageNumber, verseNumber, text, translation }
 * @param {Function} onVerseChange - callback(verseNumber)
 * @param {Function} onPageScroll - callback for auto-scroll to current verse
 */
export const RecitationSheet = ({
  currentVerse,
  onVerseChange,
  onPageScroll,
  isDarkMode = false,
}) => {
  // حالة الشيت
  const [activeTab, setActiveTab] = useState('commentary'); // commentary|translation|listening|more
  const [snapPoint, setSnapPoint] = useState(0.45); // 45% or 92%
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentReader, setCurrentReader] = useState('abdul-basit');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [repeatMode, setRepeatMode] = useState(1); // 1, 3, or Infinity
  
  // حالة التعليق
  const [selectedCommentator, setSelectedCommentator] = useState('tabari');
  const [isDetailedMode, setIsDetailedMode] = useState(false);
  const [commentaryFontSize, setCommentaryFontSize] = useState(17);

  // صوت
  const [volume, setVolume] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Highlight current verse in main page
  useEffect(() => {
    if (onPageScroll && currentVerse) {
      onPageScroll(currentVerse.verseNumber);
    }
  }, [currentVerse, onPageScroll]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    // TODO: استدعاء محرك التشغيل الفعلي
  }, [isPlaying]);

  const handleNextVerse = useCallback(() => {
    if (onVerseChange) {
      onVerseChange(currentVerse.verseNumber + 1);
    }
  }, [currentVerse, onVerseChange]);

  const handlePrevVerse = useCallback(() => {
    if (onVerseChange) {
      onVerseChange(Math.max(1, currentVerse.verseNumber - 1));
    }
  }, [currentVerse, onVerseChange]);

  return (
    <BottomSheet
      snapPoints={[0.45, 0.92]}
      initialSnapPoint={0.45}
      onSnapPointChange={setSnapPoint}
      isDarkMode={isDarkMode}
    >
      {/* مقبض السحب */}
      <BottomSheetHandle isDarkMode={isDarkMode} />

      {/* شريط التلاوة الثابت (أعلى الشيت) */}
      <PlaybackBar
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        currentTime={currentTime}
        duration={duration}
        onSeek={setCurrentTime}
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        repeatMode={repeatMode}
        onRepeatChange={setRepeatMode}
        currentReader={currentReader}
        onReaderChange={setCurrentReader}
        isDarkMode={isDarkMode}
      />

      {/* التبويبات */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
      />

      {/* محتوى التبويب النشط */}
      <div
        className="recitation-sheet-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: isDarkMode ? '#121212' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
        }}
      >
        {activeTab === 'commentary' && (
          <CommentaryView
            verse={currentVerse}
            commentator={selectedCommentator}
            onCommentatorChange={setSelectedCommentator}
            isDetailed={isDetailedMode}
            onDetailedChange={setIsDetailedMode}
            fontSize={commentaryFontSize}
            onFontSizeChange={setCommentaryFontSize}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'translation' && (
          <TranslationView
            verse={currentVerse}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'listening' && (
          <ListeningView
            verse={currentVerse}
            currentReader={currentReader}
            onReaderChange={setCurrentReader}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'more' && (
          <MoreMenu
            verse={currentVerse}
            onAction={handleMoreMenuAction}
            isDarkMode={isDarkMode}
          />
        )}
      </div>

      {/* أزرار التنقل بين الآيات */}
      <VerseNavigation
        onPrevious={handlePrevVerse}
        onNext={handleNextVerse}
        isDarkMode={isDarkMode}
      />
    </BottomSheet>
  );
};

/**
 * @component TabBar
 * التبويبات المقسّمة
 */
const TabBar = ({ activeTab, onTabChange, isDarkMode }) => {
  const tabs = [
    { id: 'commentary', label: 'التفسير' },
    { id: 'translation', label: 'الترجمة' },
    { id: 'listening', label: 'الاستماع' },
    { id: 'more', label: 'المزيد' },
  ];

  return (
    <div
      className="tab-bar"
      style={{
        display: 'flex',
        borderBottom: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
        direction: 'rtl',
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            padding: '12px 8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === tab.id 
              ? '#D4AF37' 
              : isDarkMode ? '#999' : '#666',
            borderBottom: activeTab === tab.id 
              ? `3px solid #D4AF37` 
              : 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            transition: 'all 0.3s ease',
            minHeight: 44, // accessibility: touch target
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

/**
 * @component VerseNavigation
 * أزرار الآية السابقة/التالية
 */
const VerseNavigation = ({ onPrevious, onNext, isDarkMode }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderTop: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
        gap: 12,
      }}
    >
      <button
        onClick={onPrevious}
        style={{
          flex: 1,
          padding: '12px',
          minHeight: 44,
          backgroundColor: isDarkMode ? '#2a2a2a' : '#e8e8e8',
          border: 'none',
          color: isDarkMode ? '#fff' : '#000',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 'bold',
          transition: 'background-color 0.2s',
        }}
      >
        ← الآية السابقة
      </button>

      <button
        onClick={onNext}
        style={{
          flex: 1,
          padding: '12px',
          minHeight: 44,
          backgroundColor: isDarkMode ? '#2a2a2a' : '#e8e8e8',
          border: 'none',
          color: isDarkMode ? '#fff' : '#000',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 'bold',
          transition: 'background-color 0.2s',
        }}
      >
        الآية التالية →
      </button>
    </div>
  );
};

/**
 * Helper: معالج قائمة "المزيد"
 */
const handleMoreMenuAction = (action, verse) => {
  switch (action) {
    case 'copy':
      navigator.clipboard.writeText(verse.text);
      break;
    case 'share':
      if (navigator.share) {
        navigator.share({
          title: `آية ${verse.verseNumber}`,
          text: verse.text,
        });
      }
      break;
    case 'bookmark':
      // TODO: save to bookmarks
      break;
    default:
      break;
  }
};

export default RecitationSheet;
