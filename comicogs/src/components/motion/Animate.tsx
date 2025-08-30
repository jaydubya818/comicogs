'use client';

import React, { useEffect, useState } from 'react';

// Available animation names from our Animatopy CSS
export type AnimationName = 
  | 'fade-in' | 'fade-out' | 'fade-in-up' | 'fade-in-down' | 'fade-in-left' | 'fade-in-right'
  | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  | 'scale-in' | 'scale-out' | 'scale-up' | 'scale-down'
  | 'bounce-in' | 'bounce-up' | 'pulse' | 'pulse-once'
  | 'wobble' | 'flip-x' | 'flip-y' | 'rotate-in' | 'rotate-out'
  | 'hover-lift' | 'hover-scale' | 'hover-rotate'
  | 'card-enter' | 'modal-enter' | 'drawer-enter'
  | 'button-press' | 'loading-pulse' | 'success-bounce' | 'error-wobble';

// Stagger animation special handling
export type StaggerAnimation = 'stagger-in';

interface AnimateProps {
  name: AnimationName | StaggerAnimation;
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
  className?: string;
  delay?: number; // in milliseconds
  duration?: 'fast' | 'normal' | 'slow' | number; // number in milliseconds
  onAnimationEnd?: () => void;
  onAnimationStart?: () => void;
  disabled?: boolean; // Force disable animation
  trigger?: 'mount' | 'hover' | 'focus' | 'click' | 'visible'; // When to trigger animation
  [key: string]: any; // Additional props for the underlying element
}

// Hook to detect if user prefers reduced motion
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// Hook for intersection observer (visibility trigger)
function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [elementRef, options]);

  return isVisible;
}

export function Animate({
  name,
  as: Component = 'div',
  children,
  className = '',
  delay = 0,
  duration = 'normal',
  onAnimationEnd,
  onAnimationStart,
  disabled = false,
  trigger = 'mount',
  ...props
}: AnimateProps) {
  const prefersReducedMotion = useReducedMotion();
  const [shouldAnimate, setShouldAnimate] = useState(trigger === 'mount');
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = React.useRef<HTMLElement>(null);
  const isVisible = useIntersectionObserver(elementRef, { threshold: 0.1 });

  // Determine if animation should be disabled
  const isAnimationDisabled = disabled || prefersReducedMotion;

  // Handle visibility trigger
  useEffect(() => {
    if (trigger === 'visible' && isVisible && !hasAnimated) {
      setShouldAnimate(true);
      setHasAnimated(true);
    }
  }, [trigger, isVisible, hasAnimated]);

  // Generate animation class name
  const getAnimationClassName = () => {
    if (isAnimationDisabled || !shouldAnimate) return '';
    return `animatopy-${name}`;
  };

  // Generate custom CSS for duration and delay
  const getAnimationStyle = (): React.CSSProperties => {
    if (isAnimationDisabled) return {};

    const style: React.CSSProperties = {};

    // Handle delay
    if (delay > 0) {
      style.animationDelay = `${delay}ms`;
    }

    // Handle custom duration
    if (typeof duration === 'number') {
      style.animationDuration = `${duration}ms`;
    } else {
      // Use CSS custom properties for predefined durations
      const durationVar = `var(--motion-duration-${duration}, ${
        duration === 'fast' ? '150ms' : 
        duration === 'slow' ? '300ms' : '200ms'
      })`;
      style.animationDuration = durationVar;
    }

    return style;
  };

  // Handle trigger events
  const handleTriggerEvent = (eventType: string) => {
    if (trigger === eventType && !isAnimationDisabled) {
      setShouldAnimate(true);
    }
  };

  // Animation event handlers
  const handleAnimationStart = (event: React.AnimationEvent) => {
    onAnimationStart?.();
    props.onAnimationStart?.(event);
  };

  const handleAnimationEnd = (event: React.AnimationEvent) => {
    onAnimationEnd?.();
    props.onAnimationEnd?.(event);
    
    // Reset will-change for performance
    if (elementRef.current) {
      elementRef.current.style.willChange = 'auto';
    }
  };

  // Combine class names
  const combinedClassName = [
    className,
    getAnimationClassName(),
  ].filter(Boolean).join(' ');

  // Combine event handlers based on trigger
  const eventHandlers = {
    ...(trigger === 'hover' && {
      onMouseEnter: () => handleTriggerEvent('hover'),
    }),
    ...(trigger === 'focus' && {
      onFocus: () => handleTriggerEvent('focus'),
    }),
    ...(trigger === 'click' && {
      onClick: () => handleTriggerEvent('click'),
    }),
    onAnimationStart: handleAnimationStart,
    onAnimationEnd: handleAnimationEnd,
  };

  // Remove trigger event handlers from props to avoid conflicts
  const { onMouseEnter, onFocus, onClick, onAnimationStart: _, onAnimationEnd: __, ...restProps } = props;

  return React.createElement(
    Component,
    {
      ref: elementRef,
      className: combinedClassName,
      style: {
        ...getAnimationStyle(),
        ...props.style,
      },
      ...eventHandlers,
      ...restProps,
    },
    children
  );
}

// Convenience components for common use cases
export function FadeIn({
  children,
  delay = 0,
  className = '',
  ...props
}: Omit<AnimateProps, 'name'>) {
  return (
    <Animate name="fade-in" delay={delay} className={className} {...props}>
      {children}
    </Animate>
  );
}

export function SlideUp({
  children,
  delay = 0,
  className = '',
  ...props
}: Omit<AnimateProps, 'name'>) {
  return (
    <Animate name="slide-up" delay={delay} className={className} {...props}>
      {children}
    </Animate>
  );
}

export function ScaleIn({
  children,
  delay = 0,
  className = '',
  ...props
}: Omit<AnimateProps, 'name'>) {
  return (
    <Animate name="scale-in" delay={delay} className={className} {...props}>
      {children}
    </Animate>
  );
}

export function BounceIn({
  children,
  delay = 0,
  className = '',
  ...props
}: Omit<AnimateProps, 'name'>) {
  return (
    <Animate name="bounce-in" delay={delay} className={className} {...props}>
      {children}
    </Animate>
  );
}

// Stagger component for animating lists
interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number; // milliseconds between each child animation
  as?: keyof JSX.IntrinsicElements;
}

export function Stagger({
  children,
  className = '',
  staggerDelay = 50,
  as: Component = 'div',
  ...props
}: StaggerProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return React.createElement(Component, { className, ...props }, children);
  }

  return React.createElement(
    Component,
    {
      className: `${className} animatopy-stagger-in`,
      style: {
        '--stagger-delay': `${staggerDelay}ms`,
      } as React.CSSProperties,
      ...props,
    },
    children
  );
}

// HOC for adding animations to existing components
export function withAnimation<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  animationName: AnimationName,
  animationProps?: Partial<AnimateProps>
) {
  return function AnimatedComponent(props: P) {
    return (
      <Animate name={animationName} {...animationProps}>
        <WrappedComponent {...props} />
      </Animate>
    );
  };
}

// Animation utility hooks
export function useAnimation(animationName: AnimationName) {
  const prefersReducedMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);

  const trigger = () => {
    if (!prefersReducedMotion) {
      setIsAnimating(true);
    }
  };

  const reset = () => {
    setIsAnimating(false);
  };

  const className = isAnimating && !prefersReducedMotion ? `animatopy-${animationName}` : '';

  return {
    trigger,
    reset,
    isAnimating,
    className,
    style: {
      animationFillMode: 'forwards' as const,
    },
  };
}

// Performance monitoring
export function useAnimationPerformance() {
  const [animationCount, setAnimationCount] = useState(0);
  const [averageFrameTime, setAverageFrameTime] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let totalFrameTime = 0;
    let lastTime = performance.now();

    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastTime;
      
      frameCount++;
      totalFrameTime += frameTime;
      setAverageFrameTime(totalFrameTime / frameCount);
      
      lastTime = currentTime;
      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }, []);

  return {
    animationCount,
    averageFrameTime,
    isPerformant: averageFrameTime < 16.67, // 60fps threshold
  };
}
