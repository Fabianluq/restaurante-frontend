import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  constructor(private location: Location, private router: Router) {}

  goBackOr(fallback: string | any[] = ['/dashboard']): void {
    // If there is history to go back to, prefer back; otherwise navigate to fallback
    if (window.history.length > 1) {
      this.location.back();
    } else {
      const commands = Array.isArray(fallback) ? fallback : [fallback];
      this.router.navigate(commands);
    }
  }
}


