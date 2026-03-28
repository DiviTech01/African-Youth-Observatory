import React from "react";

interface AfricanDividerProps {
  className?: string;
}

const AfricanDivider: React.FC<AfricanDividerProps> = ({ className = "" }) => {
  return (
    <div
      className={`w-full h-2 opacity-50 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='8' viewBox='0 0 24 8'%3E%3Cpath d='M0 8 L6 0 L12 8' fill='none' stroke='%232D6A4F' stroke-width='1.5'/%3E%3Cpath d='M8 8 L14 0 L20 8' fill='none' stroke='%23D4A017' stroke-width='1.5'/%3E%3Cpath d='M16 8 L22 0 L28 8' fill='none' stroke='%23C1121F' stroke-width='1.5'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat-x",
        backgroundSize: "24px 8px",
        backgroundPosition: "center",
      }}
    />
  );
};

export { AfricanDivider };
export default AfricanDivider;
