import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { Place } from '../place.model';
import { PlacesComponent } from '../places.component';
import { PlacesContainerComponent } from '../places-container/places-container.component';
import { PlacesService } from '../places.service';

/**
 * Component that displays a list of available places fetched from the backend.
 * Allows the user to select a place to add it to their list.
 */
@Component({
  selector: 'app-available-places',
  standalone: true,
  templateUrl: './available-places.component.html',
  styleUrl: './available-places.component.css',
  imports: [PlacesComponent, PlacesContainerComponent],
})
export class AvailablePlacesComponent implements OnInit {
  /**
   * Signal that holds the fetched places from the server.
   */
  places = signal<Place[] | undefined>(undefined);

  /**
   * Signal indicating whether the data is currently being fetched.
   */
  isFetching = signal(false);

  /**
   * Signal holding any error message that occurred during data fetching.
   */
  error = signal('');

  /**
   * Reference to the PlacesService used to interact with the backend.
   */
  private placesService = inject(PlacesService);

  /**
   * Angular DestroyRef to clean up subscriptions when the component is destroyed.
   */
  private destroyRef = inject(DestroyRef);

  /**
   * Lifecycle hook: Called when the component is initialized.
   * Fetches available places from the server and sets up cleanup on destroy.
   */
  ngOnInit() {
    this.isFetching.set(true);
    const subscription = this.placesService.loadAvailablePlaces().subscribe({
      next: (places) => {
        this.places.set(places);
      },
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
   * Called when a user selects a place.
   * Sends a request to add the selected place to the user's places.
   *
   * @param selectedPlace The place selected by the user.
   */
  onSelectPlace(selectedPlace: Place) {
    const subscription = this.placesService
      .addPlaceToUserPlaces(selectedPlace.id)
      .subscribe({
        // next: (responseData) => console.log(responseData),
      });

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
