/**
 * src/features/mushaf/components/RecitationSheet/BottomSheet.jsx
 * شيت سفلي بنقاط التصاق (snap points)
 */

import React, { useState, useRef } from 'react';

/**
 * @component BottomSheet
 * شيت سفلي مع مقابض سحب ونقاط التصاق
 */
export const BottomSheet = ({
  snapPoints = [0.45, 0.92],
  initialSnapPoint = 0.45,
  onSnapPointChange,
  children,
  isDarkMode = false,
}) => {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const sheetRef = useRef(null);

  return (
    <div
      ref={sheetRef}
      className="bottom-sheet"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${currentSnapPoint * 100}vh`,
        backgroundColor: isDarkMode ? '#121212' : '#ffffff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        transition: 'height 0.3s ease-out',
      }}
    >
      {children}
    </div>
  );
};

/**
 * @component BottomSheetHandle
 * مقبض السحب في أعلى الشيت
 */
export const BottomSheetHandle = ({ isDarkMode = false }) => {
  return (
    <div
      className="bottom-sheet-handle"
      style={{
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: isDarkMode ? '#666' : '#ccc',
        margin: '12px auto',
        cursor: 'grab',
      }}
    />
  );
};

export default BottomSheet;
