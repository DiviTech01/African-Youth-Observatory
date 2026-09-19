import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Content } from '@/components/cms';
import { readConsent, writeConsent, type ConsentChoice } from '@/lib/consent';

/**
 * The cookie banner.
 *
 * Previously it offered "Accept All" and "Manage Preferences", both of which
 * simply dismissed it, and the value they stored was never read by anything.
 * There was no way to say no. Now the two buttons are a genuine accept and a
 * genuine reject, the choice is recorded, and `hasConsentedTo()` in
 * `@/lib/consent` is what anything non-essential has to ask.
 */
const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent() === null) setVisible(true);
  }, []);

  const choose = (choice: ConsentChoice) => () => {
    writeConsent(choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="dialog"
          aria-label="Cookie choices"
        >
          <Card className="mx-auto max-w-2xl">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                <Content
                  as="p"
                  id="cookie_consent.message"
                  fallback="We store a little data on your device to keep you signed in and remember your preferences. We run no advertising and no third-party tracking."
                />
                <Link to="/cookies" className="text-primary hover:underline">
                  <Content as="span" id="cookie_consent.learn_more" fallback="What we store" />
                </Link>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={choose('rejected')}>
                  <Content as="span" id="cookie_consent.reject" fallback="Reject non-essential" />
                </Button>
                <Button size="sm" onClick={choose('accepted')}>
                  <Content as="span" id="cookie_consent.accept" fallback="Accept all" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
