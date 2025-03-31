// components/WastebinSVG.tsx
import React, { FC } from 'react';

interface WastebinSVGProps {
  width?: number;
  height?: number;
  className?: string;
}

const WastebinSVG: FC<WastebinSVGProps> = ({ width = 100, height = 100, className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bin Body */}
      <path
        d="M30 20 H70 L65 80 H35 L30 20 Z"
        fill="#666666" // Gray bin body
        stroke="#333333"
        strokeWidth="2"
      />

      {/* Bin Lid */}
      <rect
        x="25"
        y="10"
        width="50"
        height="10"
        rx="2"
        fill="#333333" // Darker gray lid
        stroke="#000000"
        strokeWidth="2"
      />

      {/* Lid Handle */}
      <rect
        x="45"
        y="8"
        width="10"
        height="4"
        rx="1"
        fill="#555555"
      />

      {/* Waste Lines (indicating trash) */}
      <line
        x1="40"
        y1="30"
        x2="50"
        y2="40"
        stroke="#FF5555" // Red for waste
        strokeWidth="2"
      />
      <line
        x1="50"
        y1="30"
        x2="40"
        y2="40"
        stroke="#FF5555"
        strokeWidth="2"
      />
      <line
        x1="55"
        y1="35"
        x2="65"
        y2="45"
        stroke="#FF5555"
        strokeWidth="2"
      />
    </svg>
  );
};

export default WastebinSVG;