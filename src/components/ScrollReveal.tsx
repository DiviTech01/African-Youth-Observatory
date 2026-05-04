import React from 'react';
import { motion, type Variants } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'fade';

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Stagger index — multiplies `delayStep` to offset entry per item in a list. */
  index?: number;
  /** Per-index delay in seconds (default 0.05s — keeps long lists fast). */
  delayStep?: number;
  /** Initial offset direction. `fade` skips translate and only fades. */
  direction?: Direction;
  /** Translate distance in pixels for non-fade directions. */
  distance?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Viewport amount required to trigger (0–1). */
  amount?: number;
  /** Animate every time it re-enters the viewport, or only once (default true). */
  once?: boolean;
  className?: string;
  as?: keyof typeof motion;
}

const offsetFor = (d: Direction, dist: number) => {
  switch (d) {
    case 'up':    return { y: dist };
    case 'down':  return { y: -dist };
    case 'left':  return { x: dist };
    case 'right': return { x: -dist };
    case 'fade':  return {};
  }
};

const buildVariants = (d: Direction, dist: number, duration: number): Variants => ({
  hidden:  { opacity: 0, ...offsetFor(d, dist) },
  visible: { opacity: 1, x: 0, y: 0, transition: { duration, ease: [0.22, 1, 0.36, 1] } },
});

/**
 * Wrap a list item or section to fade/slide it in as it scrolls into view.
 *
 * - Pass `index` when used in a list to stagger entries.
 * - Set `once={false}` if you want the animation to replay on every scroll-back.
 * - For full-row reveals (e.g. dashboard sections), `direction="up"` is the default.
 */
const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  index = 0,
  delayStep = 0.05,
  direction = 'up',
  distance = 16,
  duration = 0.5,
  amount = 0.2,
  once = true,
  className,
  as = 'div',
}) => {
  const Component = (motion[as] as typeof motion.div) ?? motion.div;
  const variants = buildVariants(direction, distance, duration);
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
      transition={{ delay: index * delayStep }}
    >
      {children}
    </Component>
  );
};

export default ScrollReveal;
