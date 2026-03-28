import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'ayd_cookie_consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const handleManage = () => {
    // For now, treat "Manage Preferences" the same as accept.
    // A full preferences modal can be wired up later.
    localStorage.setItem(STORAGE_KEY, 'managed');
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
        >
          <Card className="mx-auto max-w-2xl">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                We use cookies to improve your experience. By continuing to use this site you agree
                to our use of cookies.
              </p>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleManage}>
                  Manage Preferences
                </Button>
                <Button size="sm" onClick={handleAccept}>
                  Accept All
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
