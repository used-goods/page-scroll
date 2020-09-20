import { useCallback, useEffect, useMemo, useRef } from "react";

/**
 * This hook was @used with nextjs in https://agatamanosa.pl to handle showing
 * of the header on mobile on reverse scroll among other smaller micro interactions.
 */

const defaultState = {
  delta: 0,
  reverseScrolled: false,
  pastFold: false,
  scrolled: false,
  prevScrollY: 0,
  scrollY: 0,
  resetPageScroll: () => {},
};

export type ScrollState = typeof defaultState;
export type OnScrollListener = (event: ScrollState) => void;

export interface PageScrollProps {
  // distance from the top of the screen before we register page as scrolled
  scrollThreshold?: number;
  // distance scroll need to travel in reverse to register page as reverse scrolled
  reverseScrollOffset?: number;
  // positive or negative offset before page gets registered as past the fold
  foldThreshold?: number;
  scrolledClass?: string;
  pastFoldClass?: string;
  reverseScrollClass?: string;
  onScroll?: OnScrollListener | OnScrollListener[];
}

export const usePageScroll = ({
  onScroll,
  scrollThreshold = 100,
  reverseScrollOffset = 100,
  foldThreshold = 0,
  scrolledClass,
  pastFoldClass,
  reverseScrollClass,
}: PageScrollProps) => {
  const state = useRef(defaultState);
  const listeners = useRef(onScroll);

  if (reverseScrollOffset <= 0) {
    throw new RangeError("reverseScrollOffset must be greater than 0");
  }

  if (scrollThreshold < 0) {
    throw new RangeError("scrollThreshold should never be less than 0");
  }

  useEffect(() => {
    listeners.current = onScroll;
  }, [onScroll]);

  const resetPageScroll = useCallback(() => {
    const ref = state.current;
    ref.delta = 0;
    ref.reverseScrolled = false;

    if (reverseScrollClass) {
      document.body.classList.remove(reverseScrollClass);
    }
  }, []);

  useEffect(() => {
    const ref = state.current;
    let mounted = true;

    const handleReverseScroll = () => {
      if (reverseScrollClass) {
        const currDelta = ref.scrollY - ref.prevScrollY;
        if (currDelta < 0) {
          ref.delta = Math.max(ref.delta + currDelta, reverseScrollOffset * -1);
        } else {
          ref.delta = Math.min(0, ref.delta + currDelta);
        }

        if (
          ref.delta === reverseScrollOffset * -1 &&
          !ref.reverseScrolled &&
          scrollY > reverseScrollOffset
        ) {
          ref.reverseScrolled = true;

          document.body.classList.add(reverseScrollClass);
        }

        if (ref.reverseScrolled && (ref.delta === 0 || ref.scrollY === 0)) {
          resetPageScroll();
        }
      }
    };

    const handlePageScrolled = () => {
      if (scrolledClass) {
        ref.scrolled = ref.scrollY > scrollThreshold;
        document.body.classList[ref.scrolled ? "add" : "remove"](scrolledClass);
      }
    };

    const handlePagePastFold = () => {
      if (pastFoldClass) {
        ref.pastFold = ref.scrollY > innerHeight - foldThreshold;
        document.body.classList[ref.pastFold ? "add" : "remove"](pastFoldClass);
      }
    };

    const scrollPosCheck = () => {
      ref.scrollY = scrollY || 0;

      if (ref.scrollY !== ref.prevScrollY) {
        handleReverseScroll();
        handlePageScrolled();
        handlePagePastFold();

        if (listeners.current) {
          const event = { ...ref, resetPageScroll };
          if (Array.isArray(listeners.current)) {
            listeners.current.forEach((listener) => listener(event));
          } else {
            listeners.current(event);
          }
        }
      }

      if (mounted) {
        requestAnimationFrame(scrollPosCheck);
        ref.prevScrollY = ref.scrollY;
      }
    };

    requestAnimationFrame(scrollPosCheck);

    return () => {
      mounted = false;
    };
  }, [
    scrollThreshold,
    reverseScrollOffset,
    foldThreshold,
    scrolledClass,
    pastFoldClass,
    reverseScrollClass,
  ]);

  return useMemo(
    () => ({
      state,
      resetPageScroll,
    }),
    []
  );
};
