import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';

const EmailSent = () => {
  const [params] = useSearchParams();
  const email = params.get('email') || 'your inbox';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Grid BG */}
      <div
        className="absolute inset-0 opacity-30 w-full
        bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]
        bg-[size:6rem_5rem]
        [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_50%,transparent_100%)]"
      />

      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30 flex items-center justify-center">
            <Mail className="h-9 w-9 text-[#D4A017]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Check your email</h1>
        <p className="text-gray-400 text-base mb-2">
          We sent a confirmation link to
        </p>
        <p className="text-[#D4A017] font-semibold text-lg mb-6 break-all">{email}</p>
        <p className="text-gray-500 text-sm mb-8">
          Click the link in the email to activate your account. If you don't see it, check your spam folder.
        </p>

        <div className="space-y-3">
          <Link
            to="/auth/signin"
            className="block w-full h-11 rounded-lg bg-[#D4A017] text-black font-semibold text-sm hover:bg-[#D4A017]/90 transition-all flex items-center justify-center"
          >
            Back to Sign In
          </Link>
          <p className="text-xs text-gray-600">
            Wrong email?{' '}
            <Link to="/auth/signup" className="text-[#D4A017] hover:underline">
              Sign up again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailSent;
