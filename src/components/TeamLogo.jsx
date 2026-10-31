import { useState } from "react";

export default function TeamLogo({ src, name, alt, size = 'md', className = '' }) {
    const [ hasError, setHasError ] = useState(false);
    const teamName = name || alt;

    const sizeClasses = {
        sm: 'w-5 h-5 text-[10px]',
        md: 'w-7 h-7 text-xs',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-xl',
    }

    const selectedSize = sizeClasses[size] || sizeClasses.md;

    if (!src || hasError) {
        const initials = teamName ? teamName.substring(0, 2).toUpperCase() : 'FC';

        return (
            <div
                className={`${selectedSize} rounded-lg bg-sofa-border text-sofa-muted flex items-center justify-center font-black shrink-0 ${className}`}
            >
                {initials}
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={teamName || 'Team Logo'}
            onError={() => setHasError(true)}
            className={`${selectedSize} object-contain shrink-0 ${className}`}
            loading="lazy"
        />
    )
}

