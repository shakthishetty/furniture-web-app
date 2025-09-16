import logoImage from "@assets/Logo White_1758031405186.png";

interface LogoProps {
  height?: number;
  width?: number;
  className?: string;
  onClick?: () => void;
  "data-testid"?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export default function Logo({ 
  height = 32, 
  width = 120, 
  className = "", 
  onClick,
  "data-testid": testId = "logo",
  variant = "auto"
}: LogoProps) {
  // Determine if we need to apply dark styling (for light backgrounds)
  const shouldUseDarkStyling = variant === 'dark' || 
    (variant === 'auto' && !className.includes('text-white') && !className.includes('dark:'));
  
  // Use inline styles for more reliable filter application
  const filterStyle = shouldUseDarkStyling ? {
    filter: 'invert(1)',
    WebkitFilter: 'invert(1)'
  } : {};
  
  return (
    <img
      src={logoImage}
      alt="Site logo"
      height={height}
      width={width}
      className={`cursor-pointer ${className}`}
      style={filterStyle}
      onClick={onClick}
      data-testid={testId}
    />
  );
}