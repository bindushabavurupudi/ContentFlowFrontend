import { Calendar } from "lucide-react";

export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      {/* Animated Logo Container */}
      <div className="flex flex-col items-center gap-4">
        {/* Logo Icon with Pulse Animation */}
        <div className="relative">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg animate-pulse">
            <Calendar className="h-10 w-10 text-white" />
          </div>
          {/* Ripple Effect */}
          <div className="absolute inset-0 rounded-2xl bg-orange-500 animate-ping opacity-20"></div>
        </div>

        {/* App Name with Gradient Text */}
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
          ContentFlow
        </h1>

        {/* Tagline */}
        <p className="text-gray-500 text-sm font-medium tracking-wide">
          Your Social Media Companion
        </p>

        {/* Loading Dots Animation */}
        <div className="flex gap-1.5 mt-4">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>

      {/* Footer Text */}
      <p className="absolute bottom-8 text-gray-400 text-xs">
        © 2026 ContentFlow. All rights reserved.
      </p>
    </div>
  );
}
