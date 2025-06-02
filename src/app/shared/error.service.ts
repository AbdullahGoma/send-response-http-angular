import { Injectable, signal } from '@angular/core';

/**
 * Centralized error handling service for managing application-wide error states.
 * Provides reactive error state management using Angular signals with:
 * - Read-only public error state
 * - Controlled error display methods
 * - Automatic console logging
 * 
 * @usageNotes
 * ### Basic Usage
 * ```typescript
 * // Show error
 * errorService.showError('Something went wrong');
 * 
 * // Clear error
 * errorService.clearError();
 * 
 * // Subscribe to errors
 * effect(() => {
 *   if (errorService.error()) {
 *     // Handle error
 *   }
 * });
 * ```
 * 
 * @property error - Readonly signal containing current error message
 * @method showError - Displays error and logs to console
 * @method clearError - Resets error state
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private _error = signal('');

  /**
   * Public read-only access to current error message.
   * Returns empty string when no error is present.
   */
  error = this._error.asReadonly();

  /**
   * Displays an error message throughout the application.
   * Automatically logs the error to console.
   * @param message - User-friendly error message to display
   */
  showError(message: string) {
    console.log(`[ErrorService] ${message}`);
    this._error.set(message);
  }

  /**
   * Clears the current error state.
   * Resets the error message to empty string.
   */
  clearError() {
    this._error.set('');
  }
}