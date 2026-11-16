-- Asigna el rol Cocina a una cuenta ya registrada. Se ejecuta con sqlcmd:
--   sqlcmd -S <servidor> -E -C -I -d <base> -b -i asignar-rol-cocina.sql -v Usuario=<nombre>
SET XACT_ABORT ON;

DECLARE @UsuarioId nvarchar(450);
DECLARE @RolId nvarchar(450);

SELECT @UsuarioId = Id
FROM dbo.AspNetUsers
WHERE NormalizedUserName = UPPER(N'$(Usuario)');

IF @UsuarioId IS NULL
    THROW 50001, 'La cuenta de cocina no existe. Regístrela primero mediante la API.', 1;

SELECT @RolId = Id
FROM dbo.AspNetRoles
WHERE NormalizedName = N'COCINA';

IF @RolId IS NULL
BEGIN
    SET @RolId = CONVERT(nvarchar(36), NEWID());

    INSERT INTO dbo.AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (@RolId, N'Cocina', N'COCINA', CONVERT(nvarchar(36), NEWID()));
END;

IF NOT EXISTS (SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = @UsuarioId AND RoleId = @RolId)
    INSERT INTO dbo.AspNetUserRoles (UserId, RoleId)
    VALUES (@UsuarioId, @RolId);
