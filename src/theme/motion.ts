/**
 * Motion System - Apple-Quality Animation Presets
 * Based on Framer Motion
 */

import { Transition, Variants } from 'framer-motion'

/**
 * Apple's signature easing curves
 */
export const easings = {
  // Standard easing - most common
  standard: [0.4, 0.0, 0.2, 1] as const,

  // Decelerate - elements entering the screen
  decelerate: [0.0, 0.0, 0.2, 1] as const,

  // Accelerate - elements exiting the screen
  accelerate: [0.4, 0.0, 1, 1] as const,

  // Sharp - quick, decisive transitions
  sharp: [0.4, 0.0, 0.6, 1] as const,

  // Spring - bouncy, playful animations
  spring: [0.175, 0.885, 0.32, 1.275] as const,
}

/**
 * Duration presets (in seconds)
 */
export const durations = {
  fast: 0.15,
  base: 0.25,
  slow: 0.35,
  slower: 0.5,
}

/**
 * Transition presets
 */
export const transitions = {
  // Standard transition for most UI elements
  standard: {
    duration: durations.base,
    ease: easings.standard,
  } as Transition,

  // Fast transition for micro-interactions
  fast: {
    duration: durations.fast,
    ease: easings.sharp,
  } as Transition,

  // Slow transition for larger elements
  slow: {
    duration: durations.slow,
    ease: easings.decelerate,
  } as Transition,

  // Spring transition for playful elements
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as Transition,

  // Gentle spring for subtle bounces
  springGentle: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  } as Transition,
}

/**
 * Fade animation variants
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: transitions.standard,
  },
  exit: {
    opacity: 0,
    transition: transitions.fast,
  },
}

/**
 * Slide animation variants
 */
export const slideVariants = {
  up: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.standard,
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: transitions.fast,
    },
  },
  down: {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.standard,
    },
    exit: {
      opacity: 0,
      y: 10,
      transition: transitions.fast,
    },
  },
  left: {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: transitions.standard,
    },
    exit: {
      opacity: 0,
      x: 10,
      transition: transitions.fast,
    },
  },
  right: {
    hidden: { opacity: 0, x: 10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: transitions.standard,
    },
    exit: {
      opacity: 0,
      x: -10,
      transition: transitions.fast,
    },
  },
} as const

/**
 * Scale animation variants
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.standard,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
}

/**
 * Stagger children animation
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

/**
 * Stagger item (use with staggerContainer)
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.standard,
  },
}

/**
 * Modal/Dialog animation variants
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.base,
      ease: easings.decelerate,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: durations.fast,
      ease: easings.accelerate,
    },
  },
}

/**
 * Backdrop/Overlay animation variants
 */
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.base,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: durations.fast,
    },
  },
}

/**
 * Card hover animation
 */
export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: transitions.spring,
  },
  tap: {
    scale: 0.98,
    transition: transitions.fast,
  },
}

/**
 * Button press animation
 */
export const buttonPress = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: transitions.springGentle,
  },
  tap: {
    scale: 0.95,
    transition: transitions.fast,
  },
}

/**
 * Bounce animation for notifications
 */
export const bounceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -100,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.8,
    transition: transitions.fast,
  },
}

/**
 * Page transition variants
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.slow,
      ease: easings.decelerate,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: durations.base,
      ease: easings.accelerate,
    },
  },
}

/**
 * Collapse/Expand variants
 */
export const collapseVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: transitions.standard,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    overflow: 'visible',
    transition: transitions.standard,
  },
}

/**
 * Loading skeleton shimmer effect
 */
export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-1000px 0',
  },
  animate: {
    backgroundPosition: '1000px 0',
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: Infinity,
    },
  },
}

/**
 * Counter animation (for stat cards)
 */
export const counterSpring = {
  type: 'spring',
  stiffness: 100,
  damping: 15,
} as Transition

/**
 * Utility: Get reduced motion setting
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Utility: Get transition with reduced motion support
 */
export const getTransition = (transition: Transition): Transition => {
  if (prefersReducedMotion()) {
    return { duration: 0.01 }
  }
  return transition
}

/**
 * Utility: Get variants with reduced motion support
 */
export const getVariants = (variants: Variants): Variants => {
  if (prefersReducedMotion()) {
    // Remove transitions from all states
    const reducedVariants: Variants = {}
    for (const [key, value] of Object.entries(variants)) {
      reducedVariants[key] = {
        ...value,
        transition: { duration: 0.01 },
      }
    }
    return reducedVariants
  }
  return variants
}
