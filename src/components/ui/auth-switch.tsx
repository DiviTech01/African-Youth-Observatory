import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface AuthSwitchProps {
  onSignIn?: (data: { email: string; password: string }) => void;
  onSignUp?: (data: { name: string; email: string; password: string }) => void;
  className?: string;
}

export function AuthSwitch({ onSignIn, onSignUp, className }: AuthSwitchProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn?.(signInData);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    onSignUp?.(signUpData);
  };

  return (
    <div className={cn("relative w-full max-w-[820px] min-h-[520px] mx-auto rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-black/50", className)}>
      {/* Forms Container */}
      <div className="flex w-full min-h-[520px]">
        {/* Sign In Form - Left Side */}
        <div
          className={cn(
            "w-1/2 p-8 flex flex-col justify-center transition-all duration-500 ease-in-out",
            isSignUp ? "opacity-0 pointer-events-none -translate-x-8" : "opacity-100 translate-x-0"
          )}
        >
          <h2 className="text-2xl font-bold text-white mb-1">Sign In</h2>
          <p className="text-sm text-gray-400 mb-6">Welcome back to AYO</p>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full h-10 rounded-lg bg-white/[0.05] border border-gray-700 text-gray-300 text-sm font-medium hover:bg-white/[0.08] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-black px-2 text-gray-500">or</span></div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={signInData.email}
              onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
              required
              className="w-full h-10 px-3 rounded-lg bg-white/[0.05] border border-gray-800 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-colors"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                required
                className="w-full h-10 px-3 pr-9 rounded-lg bg-white/[0.05] border border-gray-800 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="flex justify-end">
              <button type="button" className="text-xs text-[#D4A017] hover:underline">Forgot password?</button>
            </div>
            <button type="submit" className="w-full h-10 rounded-lg bg-[#D4A017] text-black font-semibold text-sm hover:bg-[#D4A017]/90 active:scale-[0.98] transition-all">
              Sign In
            </button>
          </form>
        </div>

        {/* Sign Up Form - Right Side */}
        <div
          className={cn(
            "w-1/2 p-8 flex flex-col justify-center transition-all duration-500 ease-in-out",
            isSignUp ? "opacity-100 translate-x-0" : "opacity-0 pointer-events-none translate-x-8"
          )}
        >
          <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
          <p className="text-sm text-gray-400 mb-6">Join AYO for free</p>

          <form onSubmit={handleSignUp} className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              value={signUpData.name}
              onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
              required
              className="w-full h-10 px-3 rounded-lg bg-white/[0.05] border border-gray-800 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-colors"
            />
            <input
              type="email"
              placeholder="Email"
              value={signUpData.email}
              onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
              required
              className="w-full h-10 px-3 rounded-lg bg-white/[0.05] border border-gray-800 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={signUpData.password}
              onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
              required
              className="w-full h-10 px-3 rounded-lg bg-white/[0.05] border border-gray-800 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-colors"
            />
            <button type="submit" className="w-full h-10 rounded-lg bg-[#D4A017] text-black font-semibold text-sm hover:bg-[#D4A017]/90 active:scale-[0.98] transition-all">
              Create Account
            </button>
            <p className="text-[10px] text-gray-500 text-center">
              By signing up, you agree to our <a href="#" className="text-[#D4A017] hover:underline">Terms</a> & <a href="#" className="text-[#D4A017] hover:underline">Privacy</a>
            </p>
          </form>

          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              ← Back to home
            </a>
          </div>
        </div>
      </div>

      {/* Sliding Overlay Panel */}
      <motion.div
        className="absolute top-0 w-1/2 h-full z-20"
        initial={false}
        animate={{ x: isSignUp ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      >
        <div className="relative w-full h-full bg-gradient-to-br from-[#D4A017] to-[#8B6914] flex flex-col items-center justify-center text-center p-10 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 rounded-full border border-white/20" />
          <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5" />

          {isSignUp ? (
            <motion.div
              key="to-signin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative z-10"
            >
              <div className="h-14 w-14 rounded-xl bg-black/20 flex items-center justify-center font-bold text-xl text-white mx-auto mb-6">
                AYO
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Welcome Back!</h3>
              <p className="text-black/70 text-sm mb-8 max-w-[240px]">
                Already have an account? Sign in to access your dashboard and youth data.
              </p>
              <button
                onClick={() => setIsSignUp(false)}
                className="px-8 py-2.5 rounded-lg border-2 border-black/30 text-black font-semibold text-sm hover:bg-black/10 active:scale-95 transition-all"
              >
                Sign In
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="to-signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative z-10"
            >
              <div className="h-14 w-14 rounded-xl bg-black/20 flex items-center justify-center font-bold text-xl text-white mx-auto mb-6">
                AYO
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Hello, Friend!</h3>
              <p className="text-black/70 text-sm mb-8 max-w-[240px]">
                New here? Create an account to explore Africa's youth data across 54 nations.
              </p>
              <button
                onClick={() => setIsSignUp(true)}
                className="px-8 py-2.5 rounded-lg border-2 border-black/30 text-black font-semibold text-sm hover:bg-black/10 active:scale-95 transition-all"
              >
                Sign Up
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default AuthSwitch;
