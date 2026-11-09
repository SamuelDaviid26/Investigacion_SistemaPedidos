import { Routes } from '@angular/router';
import { Acceso } from './pages/acceso/acceso';

export const routes: Routes = [
  { path: '', redirectTo: 'acceso', pathMatch: 'full' },
  { path: 'acceso', component: Acceso }
];
