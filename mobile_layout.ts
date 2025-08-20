// components/layout/mobile-layout.tsx
"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface MobileLayoutProps {
  children: ReactNode
  className?: string
  hasSafeArea?: boolean
  hasBottomNav?: boolean
}

export function MobileLayout({ 
  children, 
  className, 
  hasSafeArea = true,
  hasBottomNav = false 
}: MobileLayoutProps) {
  return (
    <div 
      className={cn(
        // Base mobile container
        "min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
        // Safe area için padding
        hasSafeArea && [
          "pt-safe-area-inset-top",
          "pb-safe-area-inset-bottom", 
          "pl-safe-area-inset-left",
          "pr-safe-area-inset-right"
        ],
        // Bottom nav varsa padding ekle
        hasBottomNav && "pb-16",
        className
      )}
    >
      {children}
    </div>
  )
}

// components/layout/game-container.tsx
interface GameContainerProps {
  children: ReactNode
  className?: string
}

export function GameContainer({ children, className }: GameContainerProps) {
  return (
    <div className={cn(
      // Mobil-first container
      "w-full max-w-md mx-auto px-4 py-6",
      // Tablet
      "sm:max-w-2xl sm:px-6",
      // Desktop  
      "lg:max-w-6xl lg:px-8",
      className
    )}>
      {children}
    </div>
  )
}

// components/layout/mobile-header.tsx
interface MobileHeaderProps {
  title: string
  leftButton?: ReactNode
  rightButton?: ReactNode
  showBack?: boolean
  onBack?: () => void
}

export function MobileHeader({ 
  title, 
  leftButton, 
  rightButton, 
  showBack,
  onBack 
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {leftButton}
        </div>
        
        <h1 className="text-lg font-semibold text-white truncate">
          {title}
        </h1>
        
        <div className="flex items-center gap-2">
          {rightButton}
        </div>
      </div>
    </header>
  )
}

// components/layout/bottom-sheet.tsx
interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl border-t border-gray-700 max-h-[90vh] overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="px-4 pb-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}