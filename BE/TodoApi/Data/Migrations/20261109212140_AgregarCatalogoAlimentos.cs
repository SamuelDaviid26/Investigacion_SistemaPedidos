using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TodoApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCatalogoAlimentos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Alimentos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alimentos", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Alimentos",
                columns: new[] { "Id", "Nombre" },
                values: new object[,]
                {
                    { 1, "Fresco" },
                    { 2, "Hamburguesa" },
                    { 3, "Helado" },
                    { 4, "Hot dog" },
                    { 5, "Milkshake" },
                    { 6, "Papas" },
                    { 7, "Pollo" },
                    { 8, "Sándwich" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Alimentos_Nombre",
                table: "Alimentos",
                column: "Nombre",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alimentos");
        }
    }
}
