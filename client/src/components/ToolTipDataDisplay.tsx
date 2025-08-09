// this component's parent is ComponentMap in the original Reactime codebase
// also look into the TooltipInPortal component (but it's not one of the .tsx files that exists in the repo...)
// I think it may be in the package @visx/tooltip?
// @visx seems to be a component library made by Airbnb
// they're imported in the Ax.tsx file. not sure what Ax means...

import React from 'react';
import { JSONTree } from 'react-json-tree';
// import '../styles/stateContainer.scss'

const ToolTipDataDisplay = ({ data }) => {
  console.log('data:', data);
  if (!data) return null;

  const jsonTheme = {
    scheme: 'custom',
    base00: 'transparent',
    base0B: '#14b8a6', // dark navy for strings
    base0D: '#60a5fa', // Keys
    base09: '#f59e0b', // Numbers
    base0C: '#EF4444', // Null values
  };

  // our content should already be parsed JSON...not sure if Reactime handles parsing here or it's just good to check again or something
  const renderSection = (title, content, isReducer = false) => {
    console.log('content in renderSection:', content);
    if (!content || (Array.isArray(content) && content.length === 0) || Object.keys(content).length === 0) {
      return null;
    }

    return (
      <div className='tooltip-section'>
        <div className='tooltip-section-title'>{title}</div>
        <div className='tooltip-data'>
          <JSONTree data={JSON.parse(content)} theme={jsonTheme} />
        </div>
      </div>
    );
  };

  return <div className='tooltip-container'>{renderSection('', data)}</div>;
};

export default ToolTipDataDisplay;
