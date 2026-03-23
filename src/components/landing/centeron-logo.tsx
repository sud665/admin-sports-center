"use client";

export function CenterOnLogo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-6", md: "h-8", lg: "h-10" };
  const textSize = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg className={sizeMap[size]} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="15" fill="#3772FF"/>
        <path d="M16 6v10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        <path d="M10.5 9.5a9 9 0 1 0 11 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
      </svg>
      <span className={`${textSize[size]} font-bold tracking-tight text-white`}>
        Center<span className="text-[#3772FF]">On</span>
      </span>
    </div>
  );
}
