import { expect, iniciarSesion, marcaUnica, test } from './fixtures';
import { CLAVE } from './entorno';

test.describe('acceso', () => {
  test('la raíz lleva al formulario de inicio de sesión', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/acceso$/);
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.getByLabel('Usuario')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
  });

  test('avisa cuando faltan el usuario o la contraseña', async ({ page }) => {
    await page.goto('/acceso');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByRole('alert')).toHaveText('Ingresá tu usuario y contraseña.');
    await expect(page).toHaveURL(/\/acceso$/);
  });

  test('rechaza una contraseña incorrecta', async ({ page, cliente }) => {
    await page.goto('/acceso');
    await page.getByLabel('Usuario').fill(cliente.username);
    await page.getByLabel('Contraseña').fill('Incorrecta1!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');
    await expect(page).toHaveURL(/\/acceso$/);
  });

  test('un cliente inicia sesión y llega a Nuevo pedido', async ({ page, cliente }) => {
    await iniciarSesion(page, cliente, /\/nuevo-pedido$/);

    await expect(page.getByRole('heading', { name: 'Nuevo pedido' })).toBeVisible();
  });

  test('permite crear una cuenta y luego iniciar sesión con ella', async ({ page }) => {
    const usuario = marcaUnica('registro');

    await page.goto('/acceso');
    await page.getByRole('button', { name: 'Crear una cuenta', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();

    await page.getByLabel('Usuario').fill(usuario);
    await page.getByLabel('Contraseña').fill(CLAVE);
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();

    await expect(page.getByRole('status'))
      .toHaveText('Cuenta creada. Ingresá tu contraseña para iniciar sesión.');
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.getByLabel('Usuario')).toHaveValue(usuario);

    await page.getByLabel('Contraseña').fill(CLAVE);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/nuevo-pedido$/);
  });

  test('rechaza una contraseña débil al registrarse', async ({ page }) => {
    await page.goto('/acceso');
    await page.getByRole('button', { name: 'Crear una cuenta', exact: true }).click();
    await page.getByLabel('Usuario').fill(marcaUnica('debil'));
    await page.getByLabel('Contraseña').fill('abc');
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();

    await expect(page.getByRole('alert')).toContainText('Passwords must');
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
  });

  test('rechaza registrar un usuario que ya existe', async ({ page, cliente }) => {
    await page.goto('/acceso');
    await page.getByRole('button', { name: 'Crear una cuenta', exact: true }).click();
    await page.getByLabel('Usuario').fill(cliente.username);
    await page.getByLabel('Contraseña').fill(CLAVE);
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();

    await expect(page.getByRole('alert')).toContainText('already taken');
  });

  for (const ruta of ['/nuevo-pedido', '/mis-pedidos', '/cocina']) {
    test(`sin sesión, ${ruta} redirige al acceso`, async ({ page }) => {
      await page.goto(ruta);

      await expect(page).toHaveURL(/\/acceso$/);
    });
  }
});
