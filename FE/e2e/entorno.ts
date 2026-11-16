export const URL_API = 'http://localhost:5289';
export const URL_FE = 'http://localhost:4200';

export const CLAVE = 'Clave123!';
export const USUARIO_COCINA = { username: 'cocina_e2e', password: CLAVE };

export const SERVIDOR_SQL = process.env['E2E_SQL_SERVER'] ?? 'localhost';
export const BASE_DE_DATOS = process.env['E2E_DB'] ?? 'SistemaPedidosDB_E2E';

// Variables que usa la API durante las pruebas; sustituyen a appsettings y a los secretos de usuario.
export const ENTORNO_API: Record<string, string> = {
  ASPNETCORE_ENVIRONMENT: 'Development',
  ASPNETCORE_URLS: URL_API,
  Logging__LogLevel__Default: 'Warning',
  Logging__LogLevel__Microsoft: 'Warning',
  ConnectionStrings__HomeConnection:
    `Server=${SERVIDOR_SQL};Database=${BASE_DE_DATOS};Integrated Security=True;Encrypt=True;TrustServerCertificate=True`,
  Jwt__Key: 'clave-solo-para-pruebas-e2e-no-usar-en-produccion-0123456789',
  E2E_SQL_SERVER: SERVIDOR_SQL,
  E2E_DB: BASE_DE_DATOS
};
