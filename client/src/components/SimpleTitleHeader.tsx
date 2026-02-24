import React from 'react';

const SimpleTitleHeader: React.FC = () => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 24px',
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: '#ffffff'
    }}>
      <img 
        src="/your-logo.png"  // Replace with your actual logo filename
        alt="Reactime Native Logo" 
        style={{
          height: '32px',
          width: 'auto'
        }}
      />
      <h1 style={{
        margin: 0,
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1f2937'
      }}>
        Reactime Native
      </h1>
    </header>
  );
};

export default SimpleTitleHeader;