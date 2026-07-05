import { useEffect } from 'react';

type UseMediaKeyboardNavigationOptions = {
  hasMultipleMedia: boolean;
  onNext: () => void;
  onPrevious: () => void;
  open: boolean;
};

export function useMediaKeyboardNavigation({
  hasMultipleMedia,
  onNext,
  onPrevious,
  open,
}: UseMediaKeyboardNavigationOptions) {
  useEffect(() => {
    if (!open || !hasMultipleMedia) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrevious();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasMultipleMedia, onNext, onPrevious, open]);
}
