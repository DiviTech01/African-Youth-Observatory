import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthSwitch } from '@/components/ui/auth-switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SignUp = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (data: { email: string; password: string }) => {
    try {
      await signIn(data.email, data.password);
      toast({ title: "Welcome back!", description: "You have successfully signed in." });
      navigate('/dashboard');
    } catch (err) {
      toast({ title: "Sign in failed", description: err instanceof Error ? err.message : "Invalid credentials.", variant: "destructive" });
    }
  };

  const handleSignUp = async (data: { name: string; email: string; password: string }) => {
    try {
      await signUp(data.name, data.email, data.password);
      navigate(`/auth/email-sent?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast({ title: "Sign up failed", description: err instanceof Error ? err.message : "Something went wrong.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Grid BG */}
      <div
        className="absolute inset-0 opacity-30 w-full
        bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]
        bg-[size:6rem_5rem]
        [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_50%,transparent_100%)]"
      />

      <div className="relative z-10 w-full">
        <AuthSwitch
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />
      </div>
    </div>
  );
};

export default SignUp;
