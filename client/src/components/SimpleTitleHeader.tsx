import React from 'react';

const SimpleTitleHeader: React.FC = () => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 24px',
      borderBottom: '1px solid #334155',
      backgroundColor: '#1e293b',
    }}>
      <span style={{ fontSize: '20px', lineHeight: 1 }}>⏱</span>
      <h1 style={{
        margin: 0,
        fontSize: '18px',
        fontWeight: '600',
        color: '#14b8a6',
        letterSpacing: '0.01em',
        fontFamily: 'var(--font-sans)',
      }}>
        Reactime Native
      </h1>
    </header>
  );
};

export default SimpleTitleHeader;