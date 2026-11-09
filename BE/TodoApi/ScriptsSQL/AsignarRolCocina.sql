USE [SistemaPedidosDB];
GO

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @UsuarioId nvarchar(450);
    DECLARE @RolId nvarchar(450);

    SELECT @UsuarioId = Id
    FROM dbo.AspNetUsers
    WHERE NormalizedUserName = N'COCINA';

    IF @UsuarioId IS NULL
        THROW 50001, 'Primero registre la cuenta cocina mediante la API.', 1;

    SELECT @RolId = Id
    FROM dbo.AspNetRoles WITH (UPDLOCK, HOLDLOCK)
    WHERE NormalizedName = N'COCINA';

    IF @RolId IS NULL
    BEGIN
        SET @RolId = CONVERT(nvarchar(36), NEWID());

        INSERT INTO dbo.AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
        VALUES (@RolId, N'Cocina', N'COCINA', CONVERT(nvarchar(36), NEWID()));
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.AspNetUserRoles WITH (UPDLOCK, HOLDLOCK)
        WHERE UserId = @UsuarioId AND RoleId = @RolId
    )
        INSERT INTO dbo.AspNetUserRoles (UserId, RoleId)
        VALUES (@UsuarioId, @RolId);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT u.UserName AS Usuario, r.Name AS Rol
FROM dbo.AspNetUsers AS u
JOIN dbo.AspNetUserRoles AS ur ON ur.UserId = u.Id
JOIN dbo.AspNetRoles AS r ON r.Id = ur.RoleId
WHERE u.NormalizedUserName = N'COCINA'
  AND r.NormalizedName = N'COCINA';