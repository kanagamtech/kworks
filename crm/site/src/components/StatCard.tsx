import React, { useState, useRef } from 'react';
import { COLORS } from '../styles/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: string;
  trend?: string;
  trendPositive?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  trend,
  trendPositive = true,
  highlight = false,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ rotateX: number; rotateY: number; scale: number; glowX: number; glowY: number }>({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    glowX: 50,
    glowY: 50,
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation limits (-12deg to +12deg)
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;

    setTilt({
      rotateX,
      rotateY,
      scale: 1.04,
      glowX,
      glowY,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      glowX: 50,
      glowY: 50,
    });
  };

  return (
    <div
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          background: highlight
            ? `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(215, 171, 106, 0.22) 0%, rgba(46, 14, 40, 0.98) 70%), linear-gradient(145deg, #3A1533 0%, #1A0716 100%)`
            : `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(215, 171, 106, 0.14) 0%, rgba(35, 11, 31, 0.98) 70%), linear-gradient(145deg, #2D0E26 0%, #160614 100%)`,
          border: isHovered
            ? `2px solid #FFE099`
            : highlight
            ? `1.8px solid ${COLORS.goldAccent}`
            : `1.5px solid rgba(215, 171, 106, 0.55)`,
          borderRadius: '18px',
          padding: '20px 22px',
          boxShadow: isHovered
            ? `0 22px 40px -6px rgba(0, 0, 0, 0.7), 0 0 30px rgba(215, 171, 106, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.25)`
            : highlight
            ? `0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 0 18px rgba(215, 171, 106, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)`
            : `0 8px 22px -4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(215, 171, 106, 0.12)`,
          cursor: onClick ? 'pointer' : 'default',
          transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.scale}, ${tilt.scale}, ${tilt.scale})`,
          transition: isHovered ? 'transform 0.08s ease-out, box-shadow 0.15s ease-out, border 0.2s' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '148px',
          position: 'relative',
          overflow: 'hidden',
          willChange: 'transform',
        }}
      >
        {/* Subtle 3D Glass Surface Shine */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '45%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
            pointerEvents: 'none',
            borderRadius: '18px 18px 0 0',
          }}
        />

        {/* Top Row: Title & 3D Floating Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            transform: 'translateZ(20px)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#D7AB6A',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            {title}
          </span>
          {icon && (
            <div
              className="floating-3d-icon"
              style={{
                fontSize: '20px',
                background: 'linear-gradient(135deg, rgba(215, 171, 106, 0.3) 0%, rgba(156, 123, 78, 0.15) 100%)',
                border: '1px solid rgba(215, 171, 106, 0.4)',
                padding: '6px 10px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)',
                transform: 'translateZ(35px)',
              }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Middle Row: Luxury 3D Gold Value */}
        <div
          style={{
            margin: '4px 0',
            transform: 'translateZ(30px)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            className="stat-card-gold-val"
            style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '-0.3px',
              lineHeight: 1.15,
              filter: isHovered ? 'drop-shadow(0 0 14px rgba(255, 215, 0, 0.7))' : 'drop-shadow(0 2px 8px rgba(215, 171, 106, 0.4))',
              transition: 'filter 0.2s',
            }}
          >
            {value}
          </div>
        </div>

        {/* Bottom Row: Subtext and Trend Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '12px',
            transform: 'translateZ(18px)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {subtext && (
            <span
              style={{
                color: '#C4A882',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              {subtext}
            </span>
          )}
          {trend && (
            <span
              style={{
                fontWeight: 800,
                color: trendPositive ? '#4ADE80' : '#F87171',
                backgroundColor: trendPositive ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                border: trendPositive ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid rgba(248, 113, 113, 0.35)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                letterSpacing: '0.3px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
