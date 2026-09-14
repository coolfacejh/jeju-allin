interface IconProps {
  name: string;
  className?: string;
  fill?: boolean;
}

// Material Symbols Outlined 래퍼
export default function Icon({ name, className = '', fill = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
