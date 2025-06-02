import { inject, Injectable, signal } from '@angular/core';
import { Place } from './place.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, throwError } from 'rxjs';

/**
 * Service for handling all logic related to places,
 * including fetching available places and managing user-favorite places.
 */
@Injectable({
  providedIn: 'root',
})
export class PlacesService {
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
   * Adds a new place to the user's favorites both locally and on the server.
   * Performs two main operations:
   * 1. Optimistically updates the local state
   * 2. Synchronizes with the backend via PUT request
   *
   * @param place - The Place object to be added to favorites
   * @returns Observable<unknown> - The HTTP PUT request observable
   *
   * @example
   * addPlaceToUserPlaces(newPlace).subscribe({
   *   next: () => console.log('Successfully added'),
   *   error: (err) => console.error('Failed to add', err)
   * });
   */
  addPlaceToUserPlaces(place: Place) {
    this.userPlaces.update((prevPlaces) => [...prevPlaces, place]);
    return this.httpClient.put('http://localhost:3000/user-places', {
      placeId: place.id,
    });
  }

  /**
   * Removes a place from the user's favorites.
   * @param place - The place to be removed.
   */
  removeUserPlace(place: Place) {
    // Implementation needed
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
