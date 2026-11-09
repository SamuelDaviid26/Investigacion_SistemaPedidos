using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TodoApi.Models;

namespace TodoApi.Data
{
    public class TodoDbContext : IdentityDbContext<IdentityUser>
    {
        public TodoDbContext(DbContextOptions<TodoDbContext> options)
            : base(options)
        {
        }

        public DbSet<Pedido> Pedidos => Set<Pedido>();
        public DbSet<Alimento> Alimentos => Set<Alimento>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Alimento>()
                .HasIndex(a => a.Nombre)
                .IsUnique();

            builder.Entity<Alimento>().HasData(
                new Alimento { Id = 1, Nombre = "Fresco" },
                new Alimento { Id = 2, Nombre = "Hamburguesa" },
                new Alimento { Id = 3, Nombre = "Helado" },
                new Alimento { Id = 4, Nombre = "Hot dog" },
                new Alimento { Id = 5, Nombre = "Milkshake" },
                new Alimento { Id = 6, Nombre = "Papas" },
                new Alimento { Id = 7, Nombre = "Pollo" },
                new Alimento { Id = 8, Nombre = "Sándwich" }
            );
        }
    }
}
