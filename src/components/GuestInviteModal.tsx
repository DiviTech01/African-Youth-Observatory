// ============================================
// GUEST INVITE MODAL
// Shown when an unauthenticated user tries to
// download or export data. Sends a magic-link
// invite via Supabase so they can create an
// account and come straight back to the action.
// ============================================

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

interface GuestInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the user was trying to do — shown in the copy */
  action?: 'download' | 'export';
}

export const GuestInviteModal = ({
  open,
  onOpenChange,
  action = 'export',
}: GuestInviteModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const verb = action === 'download' ? 'download data' : 'export data';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    const { error: sbError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.href,
      },
    });

    setLoading(false);

    if (sbError) {
      setError(sbError.message);
      return;
    }

    setSent(true);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      // reset state when closing
      setTimeout(() => {
        setEmail('');
        setSent(false);
        setError('');
      }, 300);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        {!sent ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Sign in to {verb}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                A free account is required to {verb} from the African Youth
                Observatory. Enter your email and we'll send you a sign-in link
                — no password needed.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send Sign-in Link
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Already have an account? The link will sign you straight in.
              </p>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Check your inbox</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've sent a sign-in link to <strong>{email}</strong>.
                Click it to access your account and come back to complete
                your {action}.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => handleClose(false)}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GuestInviteModal;
