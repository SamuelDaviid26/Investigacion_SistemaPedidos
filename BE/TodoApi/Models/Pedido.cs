using System.ComponentModel.DataAnnotations;

namespace TodoApi.Models
{
    public class Pedido
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Plato { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int Cantidad { get; set; }

        [MaxLength(1000)]
        public string? Observacion { get; set; }

        public string? UserId { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public EstadoPedido Estado { get; private set; } = EstadoPedido.Recibido;

        public void CambiarEstado(EstadoPedido nuevoEstado)
        {
            bool transicionValida =
                (Estado == EstadoPedido.Recibido && nuevoEstado == EstadoPedido.EnPreparacion) ||
                (Estado == EstadoPedido.EnPreparacion && nuevoEstado == EstadoPedido.ListoParaRecoger);

            if (!transicionValida)
            {
                throw new InvalidOperationException(
                    $"No se puede cambiar el pedido de {Estado} a {nuevoEstado}.");
            }

            Estado = nuevoEstado;
        }
    }
}
