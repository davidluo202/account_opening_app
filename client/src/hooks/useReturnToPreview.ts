/**
 * Hook to detect if the user came from the preview page
 * and should show a "Return to Preview" button
 */
export function useReturnToPreview(): boolean {
  // Check if the URL contains returnToPreview=true parameter
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('returnToPreview') === 'true';
}
