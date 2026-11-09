import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Acceso } from './pages/acceso/acceso';
import { NuevoPedidoPagina } from './pages/nuevo-pedido/nuevo-pedido';
import { AuthService } from './services/auth.service';

const accesoCliente: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.obtenerToken() && !auth.esCocina()) {
    return true;
  }

  return router.createUrlTree(['/acceso']);
};

export const routes: Routes = [
  { path: '', redirectTo: 'acceso', pathMatch: 'full' },
  { path: 'acceso', component: Acceso },
  {
    path: 'nuevo-pedido',
    component: NuevoPedidoPagina,
    canActivate: [accesoCliente]
  }
];
