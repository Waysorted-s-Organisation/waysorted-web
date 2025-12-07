interface BadgeProps {
  className?: string
  children?: React.ReactNode
  variant?: 'tertiary-orange-500' | 'blue' ;
}

const Badge = ({ 
  className = "", 
  children = "New", 
  variant = 'tertiary-orange-500' 
}: BadgeProps) => {
  const variantClass = `badge-${variant}`
  
  return (
    <span 
      className={`
        ${variantClass}
        inline-flex items-center justify-center
        px-1.5 py-0.5 ml-1
        text-white text-xs font-medium
        rounded
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export default Badge