import { inject } from '@angular/core';
import { CanActivateChildFn, Router, Routes } from '@angular/router';
import { Acceso } from './pages/acceso/acceso';
import { ClienteLayout } from './pages/cliente-layout';
import { MisPedidosPagina } from './pages/mis-pedidos/mis-pedidos';
import { NuevoPedidoPagina } from './pages/nuevo-pedido/nuevo-pedido';
import { AuthService } from './services/auth.service';

const accesoCliente: CanActivateChildFn = () => {
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
    path: '',
    component: ClienteLayout,
    canActivateChild: [accesoCliente],
    children: [
      { path: 'nuevo-pedido', component: NuevoPedidoPagina },
      { path: 'mis-pedidos', component: MisPedidosPagina }
    ]
  }
];
