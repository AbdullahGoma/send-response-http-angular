import { Component, inject } from '@angular/core';

import { AvailablePlacesComponent } from './places/available-places/available-places.component';
import { UserPlacesComponent } from './places/user-places/user-places.component';
import { HeaderComponent } from "./header/header.component";
import { ErrorService } from './shared/error.service';
import { ErrorModalComponent } from "./shared/modal/error-modal/error-modal.component";

/**
 * Root application component serving as:
 * - Main layout container
 * - Error boundary handling
 * - Component composition root
 * 
 * @usageNotes
 * ### Component Structure
 * - Manages application shell layout
 * - Hosts header and main content areas
 * - Provides error handling context
 * 
 * @property error - Exposes ErrorService's error signal for template binding
 * 
 * @example
 * ```html
 * <app-header />
 * <main>
 *   <!-- Content -->
 * </main>
 * <app-error-modal [message]="error()" />
 * ```
 */
@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    AvailablePlacesComponent, 
    UserPlacesComponent, 
    HeaderComponent,
    ErrorModalComponent
  ],
})
export class AppComponent {
  /**
   * Injected ErrorService instance for centralized error handling.
   * Private access modifier enforces error handling through service API.
   */
  private errorService = inject(ErrorService);

  /**
   * Public exposure of ErrorService's error signal.
   * Used for template binding to show/hide error modal.
   */
  error = this.errorService.error;
}
