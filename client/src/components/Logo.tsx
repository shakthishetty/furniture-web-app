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
  
  // Apply appropriate filter for dark styling (inverts white logo to dark)
  const filterClass = shouldUseDarkStyling ? 'brightness-0 invert' : '';
  
  return (
    <img
      src={logoImage}
      alt="Site logo"
      height={height}
      width={width}
      className={`cursor-pointer ${className} ${filterClass}`}
      onClick={onClick}
      data-testid={testId}
    />
  );
}