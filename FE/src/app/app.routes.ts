import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, Routes } from '@angular/router';
import { Acceso } from './pages/acceso/acceso';
import { ClienteLayout } from './pages/cliente-layout';
import { CocinaPagina } from './pages/cocina/cocina';
import { MisPedidosPagina } from './pages/mis-pedidos/mis-pedidos';
import { NuevoPedidoPagina } from './pages/nuevo-pedido/nuevo-pedido';
import { AuthService } from './services/auth.service';

const accesoCliente: CanActivateChildFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.obtenerToken()) {
    return router.createUrlTree(['/acceso']);
  }

  if (auth.esCocina()) {
    return router.createUrlTree(['/cocina']);
  }

  return true;
};

const accesoCocina: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.obtenerToken()) {
    return router.createUrlTree(['/acceso']);
  }

  if (!auth.esCocina()) {
    return router.createUrlTree(['/nuevo-pedido']);
  }

  return true;
};

export const routes: Routes = [
  { path: '', redirectTo: 'acceso', pathMatch: 'full' },
  { path: 'acceso', component: Acceso },
  { path: 'cocina', component: CocinaPagina, canActivate: [accesoCocina] },
  {
    path: '',
    component: ClienteLayout,
    canActivateChild: [accesoCliente],
    children: [
      { path: 'nuevo-pedido', component: NuevoPedidoPagina },
      { path: 'mis-pedidos', component: MisPedidosPagina }
    ]
  }
];