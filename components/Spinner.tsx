interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const strokeWidthClasses = {
    sm: "stroke-[2.5]",
    md: "stroke-[3]",
    lg: "stroke-[3.5]",
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      {/* Círculo de fondo más sutil */}
      <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
      
      {/* Círculo animado */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
      
      {/* Círculo secundario para efecto de profundidad */}
      <div className="absolute inset-[2px] rounded-full border border-transparent border-t-blue-400/30 border-r-blue-400/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
  );
}

