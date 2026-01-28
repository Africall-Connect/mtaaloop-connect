import React from 'react';
import './ComparisonBook.css';

interface ComparisonBookProps {
  leftPageContent: React.ReactNode;
  rightPageContent: React.ReactNode;
  solutionSide: 'left' | 'right';
}

export const ComparisonBook: React.FC<ComparisonBookProps> = ({ leftPageContent, rightPageContent, solutionSide }) => {
  const leftPageClass = solutionSide === 'left' ? 'solution-page' : 'problem-page';
  const rightPageClass = solutionSide === 'right' ? 'solution-page' : 'problem-page';

  return (
    <div className="comparison-book-container">
      <div className="comparison-book">
        <div className={`book-page left-page ${leftPageClass}`}>
          {leftPageContent}
        </div>
        <div className="book-spine"></div>
        <div className={`book-page right-page ${rightPageClass}`}>
          {rightPageContent}
        </div>
      </div>
    </div>
  );
};
