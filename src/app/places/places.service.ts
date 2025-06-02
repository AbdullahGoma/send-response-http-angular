import { inject, Injectable, signal } from '@angular/core';
import { Place } from './place.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';

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
   * Read-only version of user places for external consumption.
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
   * Loads user-favorite (saved) places from the backend API.
   * @returns An Observable stream of user-specific places.
   */
  loadUserPlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/user-places',
      'Something went wrong fetching the favorite places. Please try again later.'
    );
  }

  /**
   * Adds a place to the user's favorite list.
   * @param placeId - The ID of the place to be added.
   * @returns An Observable representing the HTTP PUT request.
   */
  addPlaceToUserPlaces(placeId: string) {
    return this.httpClient.put('http://localhost:3000/user-places', {
      placeId: placeId,
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
