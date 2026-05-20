import React from 'react'

export function Logo({ className, color = "white" }: { className?: string, color?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Circle Background */}
        <circle cx="200" cy="160" r="110" stroke={color} strokeWidth="6" />
        
        {/* People Silhouettes */}
        <g fill={color}>
            {/* Center Person */}
            <circle cx="200" cy="85" r="15" />
            <path d="M200 105C185 105 140 120 140 180H260C260 120 215 105 200 105Z" />
            <path d="M145 125L200 110L255 125L265 110L200 90L135 110L145 125Z" />

            {/* Left Person */}
            <circle cx="140" cy="115" r="12" />
            <path d="M140 132C130 132 105 145 105 185H175C175 145 150 132 140 132Z" />
            <path d="M105 155L140 140L175 155L180 145L140 125L100 145L105 155Z" />

            {/* Right Person */}
            <circle cx="260" cy="115" r="12" />
            <path d="M260 132C250 132 225 145 225 185H295C295 145 270 132 260 132Z" />
            <path d="M225 155L260 140L295 155L300 145L260 125L220 145L225 155Z" />
        </g>

        {/* Buildings (using a slightly darker blue to create depth if color is blue, otherwise white) */}
        <g fill={color === "white" ? "#1e40af" : "currentColor"}>
            <rect x="115" y="165" width="20" height="30" />
            <rect x="135" y="155" width="25" height="40" />
            <rect x="160" y="145" width="30" height="50" />
            <rect x="190" y="130" width="35" height="65" />
            <rect x="225" y="145" width="25" height="50" />
            <rect x="250" y="160" width="20" height="35" />
            
            {/* Windows */}
            <rect x="165" y="170" width="4" height="4" fill="white" />
            <rect x="172" y="170" width="4" height="4" fill="white" />
            <rect x="165" y="177" width="4" height="4" fill="white" />
            <rect x="172" y="177" width="4" height="4" fill="white" />
        </g>

        {/* Wave effect at bottom of circle */}
        <path d="M90 190C150 170 250 230 310 190V210C250 250 150 190 90 210V190Z" fill={color} />

        {/* Typography */}
        <g fill={color}>
            {/* "Juntos" */}
            <text x="200" y="275" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="85" textAnchor="middle" letterSpacing="-4" fontStyle="italic">Juntos</text>
            
            {/* Heart in "o" of Juntos (approximated position) */}
            <path d="M282 250C282 245 288 242 291 245C294 242 300 245 300 250C300 255 291 262 291 262C291 262 282 255 282 250Z" fill="white" />

            {/* "pela" lines */}
            <rect x="75" y="295" width="90" height="3" />
            <text x="200" y="305" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="22" textAnchor="middle" letterSpacing="4">PELA</text>
            <rect x="235" y="295" width="90" height="3" />

            {/* "comunidade" */}
            <text x="200" y="355" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="72" textAnchor="middle" letterSpacing="-2">comunidade</text>
            
            {/* Smiley wave at bottom */}
            <path d="M120 365C170 385 230 385 280 365C230 375 170 375 120 365Z" fill={color} />
        </g>
      </svg>
    </div>
  )
}

export function SubLogo({ className }: { className?: string }) {
    return (
        <Logo className={className} />
    )
}
