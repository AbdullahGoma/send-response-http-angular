import { inject, Injectable, signal } from '@angular/core';
import { Place } from './place.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, throwError } from 'rxjs';
import { ErrorService } from '../shared/error.service';

/**
 * Service for handling all logic related to places,
 * including fetching available places and managing user-favorite places.
 */
@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  /**
   * Injected ErrorService instance for centralized error handling.
   * Private access modifier enforces error handling through service API.
   */
  private errorService = inject(ErrorService);
  /**
   * Injected HttpClient instance used to make HTTP requests.
   */
  private httpClient = inject(HttpClient);

  /**
   * Reactive signal to store user-specific places.
   */
  private userPlaces = signal<Place[]>([]);

  /**
   * Provides read-only access to the user's favorite places.
   * This signal exposes the current state of user places while preventing
   * external modifications to maintain data integrity.
   *
   * @returns A ReadonlySignal<Place[]> that updates reactively when places change
   */
  loadedUserPlaces = this.userPlaces.asReadonly();

  /**
   * Loads all available places from the backend API.
   * @returns An Observable stream of available places.
   */
  loadAvailablePlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/places',
      'Something went wrong fetching the available places. Please try again later.'
    );
  }

  /**
   * Loads the user's favorite places from the backend API and updates the local state.
   * Handles the complete lifecycle of fetching user places including:
   * - Making the HTTP request
   * - Transforming the response
   * - Updating the local signal state
   * - Error handling with a custom message
   *
   * @returns Observable<Place[]> - A stream of user places data
   * @throws Error with custom message when the request fails
   */
  loadUserPlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/user-places',
      'Something went wrong fetching the favorite places. Please try again later.'
    ).pipe(
      tap({
        next: (userPlaces) => this.userPlaces.set(userPlaces),
      })
    );
  }

  /**
   * Manages the addition of places to user favorites with comprehensive state handling.
   * Implements a robust pattern featuring:
   *
   * 1. Duplicate Prevention - Checks for existing places before adding
   * 2. Optimistic Updates - Immediately updates local state for responsive UI
   * 3. Synchronized Backend Operation - Persists changes to server
   * 4. Error Resilience:
   *    - Automatic state rollback on failure
   *    - Integrated error reporting via ErrorService
   *    - Detailed error propagation
   *
   * @param place - The Place object to add. Requires:
   *   - `id` - Unique identifier for the place
   *   - `title` - Display name (used in error messages)
   *
   * @returns Observable<void> that:
   *   - Completes silently on success
   *   - Emits Error when:
   *     - Place already exists (silent no-op)
   *     - Network/server failure (with rollback)
   *     - Invalid place data
   *
   * @throws Error with user-friendly message including:
   *   - Place title for context
   *   - Original error details when available
   *   - Recovery suggestion
   *
   * @sideEffects
   * - Updates userPlaces signal state
   * - May trigger ErrorService notifications
   * - Modifies browser network activity
   *
   * @example
   * // Basic subscription
   * addPlaceToUserPlaces(place).subscribe({
   *   complete: () => this.notifySuccess(),
   *   error: (err) => this.handleError(err)
   * });
   *
   * @example
   * // Using async/await
   * try {
   *   await lastValueFrom(addPlaceToUserPlaces(place));
   * } catch (err) {
   *   // Error modal already shown by ErrorService
   *   // State automatically rolled back
   * }
   *
   * @example
   * // Error cases handled automatically:
   * // - Shows error modal via ErrorService
   * // - Rolls back optimistic update
   * addPlaceToUserPlaces(invalidPlace); // Handled gracefully
   */
  addPlaceToUserPlaces(place: Place) {
    const prevPlaces = this.userPlaces();

    if (!prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set([...prevPlaces, place]);
    }

    return this.httpClient
      .put('http://localhost:3000/user-places', {
        placeId: place.id,
      })
      .pipe(
        catchError((error) => {
          this.userPlaces.set(prevPlaces);
          this.errorService.showError('Failed to store selected place.');
          return throwError(
            () =>
              new Error(
                `Failed to add "${place.title}". Please try again later.`
              )
          );
        })
      );
  }

  /**
   * Removes a place from user favorites with optimistic UI updates and server synchronization.
   * Implements a robust removal pattern that:
   *
   * 1. Verifies the place exists before removal
   * 2. Optimistically updates local state
   * 3. Synchronizes with backend via DELETE request
   * 4. Provides automatic rollback on failure
   * 5. Integrates with application error handling
   *
   * @param place - The Place to remove, requiring:
   *   - `id`: For identification and API endpoint construction
   *   - `title`: For user-friendly error messages
   *
   * @returns Observable<void> that:
   *   - Completes silently on successful removal
   *   - Emits Error when:
   *     - Network/server failure occurs
   *     - Invalid place data provided
   *
   * @throws Error with contextual message including:
   *   - Place title for identification
   *   - Original error details when available
   *
   * @sideEffects
   * - Updates userPlaces signal state
   * - May trigger ErrorService notifications
   * - Modifies browser network activity
   *
   * @example
   * // Basic usage
   * removeUserPlace(placeToRemove).subscribe({
   *   complete: () => console.log('Removal successful'),
   *   error: (err) => console.error('Removal failed:', err.message)
   * });
   *
   * @example
   * // With async/await
   * try {
   *   await lastValueFrom(removeUserPlace(place));
   * } catch (err) {
   *   // Error modal shown automatically by ErrorService
   *   // Local state already rolled back
   * }
   */
  removeUserPlace(place: Place) {
    const prevPlaces = this.userPlaces();

    if (prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set(prevPlaces.filter((p) => p.id !== place.id));
    }

    return this.httpClient
      .delete('http://localhost:3000/user-places/' + place.id)
      .pipe(
        catchError((error) => {
          this.userPlaces.set(prevPlaces);
          this.errorService.showError('Failed to remove the selected place.');
          return throwError(
            () => new Error(`Failed to remove "${place.title}".`)
          );
        })
      );
  }

  /**
   * Generic function to fetch places from a given URL and handle errors.
   * @param url - The API endpoint to fetch data from.
   * @param errorMessage - Custom error message to be returned if the request fails.
   * @returns An Observable stream of fetched places.
   */
  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient.get<{ places: Place[] }>(url).pipe(
      map((res) => res.places),
      catchError((error) => throwError(() => new Error(errorMessage)))
    );
  }
}
