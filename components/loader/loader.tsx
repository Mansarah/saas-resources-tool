import React from "react"

const Loader = () => {
  return (
    <div className="min-h-screen bg-amber-50/10 flex items-center justify-center">
      <div className="relative w-20 h-20">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>

        {/* Inner Circle */}
        <div className="absolute inset-4 rounded-full border-4 border-amber-600 border-t-transparent animate-[spin_2s_linear_infinite_reverse]"></div>

        {/* Center Dot */}
        <div className="absolute inset-12 bg-amber-500 rounded-full"></div>
      </div>
    </div>
  )
}

export default Loader
