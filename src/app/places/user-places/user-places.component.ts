import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { PlacesContainerComponent } from '../places-container/places-container.component';
import { PlacesComponent } from '../places.component';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';

/**
 * Component for displaying the user's favorite places.
 */
@Component({
  selector: 'app-user-places',
  standalone: true,
  templateUrl: './user-places.component.html',
  styleUrl: './user-places.component.css',
  imports: [PlacesContainerComponent, PlacesComponent],
})
export class UserPlacesComponent implements OnInit {
  /**
   * Tracks whether data is currently being fetched from the server.
   */
  isFetching = signal(false);

  /**
   * Holds any error messages encountered during fetching.
   */
  error = signal('');
  /**
   * Injected instance of the PlacesService to load user places.
   */
  private placesService = inject(PlacesService);

  /**
   * Reactive reference to the user's favorite places.
   * This signal automatically stays in sync with the service's state
   * and can be used directly in templates for reactive updates.
   *
   * @returns Signal<Place[]> - The current array of user places
   */
  places = this.placesService.loadedUserPlaces;

  /**
   * Injected destroy reference to clean up subscriptions on component destroy.
   */
  private destroyRef = inject(DestroyRef);

  /**
   * Lifecycle hook that runs when the component is initialized.
   * Begins fetching user places and handles loading and error states.
   */
  ngOnInit() {
    this.isFetching.set(true);

    const subscription = this.placesService.loadUserPlaces().subscribe({
      error: (error: Error) => {
        this.error.set(error.message);
      },
      complete: () => {
        this.isFetching.set(false);
      },
    });

    this.autoUnsubscribe(subscription);
  }

  /**
   * Handles the removal of a place from user favorites.
   * Manages the subscription lifecycle automatically to prevent memory leaks.
   *
   * @param place - The Place object to remove, containing:
   *   - `id`: Unique identifier for the place (required)
   *   - `title`: Display name (used in error messages if removal fails)
   *
   * @operation
   * 1. Initiates removal via PlacesService
   * 2. Automatically manages subscription cleanup
   * 3. Relies on service for error handling and state management
   *
   * @example
   * // Basic usage
   * onRemovePlace(selectedPlace);
   *
   * @note Uses automatic subscription cleanup via autoUnsubscribe
   * @see PlacesService.removeUserPlace
   * @see autoUnsubscribe
   */
  onRemovePlace(place: Place) {
    const subscription = this.placesService.removeUserPlace(place).subscribe();
    this.autoUnsubscribe(subscription);
  }

  /**
   * Automatically unsubscribes from the given subscription when the component is destroyed.
   *
   * @param subscription The subscription to clean up.
   */
  private autoUnsubscribe(subscription: Subscription) {
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
