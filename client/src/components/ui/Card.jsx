import React from 'react';

export const Card = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  const hoverableClass = hoverable ? 'transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${hoverableClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const CardBody = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};
