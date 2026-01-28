import React, { useEffect, useRef } from 'react';
import './OrderAnimation.css';

interface OrderAnimationProps {
  onAnimationComplete: () => void;
}

const OrderAnimation: React.FC<OrderAnimationProps> = ({ onAnimationComplete }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (button) {
      button.classList.add('animate');
      const timer = setTimeout(() => {
        button.classList.remove('animate');
        onAnimationComplete();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [onAnimationComplete]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'white' }}>
      <button ref={buttonRef} className="order">
        <span className="default">Complete Order</span>
        <span className="success">
          Order Placed
          <svg viewBox="0 0 12 10">
            <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
          </svg>
        </span>
        <div className="box"></div>
        <div className="truck">
          <div className="back"></div>
          <div className="front">
            <div className="window"></div>
          </div>
          <div className="light top"></div>
          <div className="light bottom"></div>
        </div>
        <div className="lines"></div>
      </button>
    </div>
  );
};

export default OrderAnimation;
