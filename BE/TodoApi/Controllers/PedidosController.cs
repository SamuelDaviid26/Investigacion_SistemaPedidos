using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Models;

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/pedidos")]
    [Authorize]
    public class PedidosController : ControllerBase
    {
        private const string RolCocina = "Cocina";
        private readonly TodoDbContext _context;

        public PedidosController(TodoDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<Pedido>> CrearPedido(Pedido solicitud)
        {
            var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (usuarioId == null)
                return Unauthorized();

            var platoSolicitado = solicitud.Plato.Trim();

            var nombreAlimento = await _context.Alimentos
                .Where(a => a.Nombre == platoSolicitado)
                .Select(a => a.Nombre)
                .SingleOrDefaultAsync();

            if (nombreAlimento == null)
                return BadRequest("El plato seleccionado no existe en el menú.");

            var pedido = new Pedido
            {
                Plato = nombreAlimento,
                Cantidad = solicitud.Cantidad,
                Observacion = solicitud.Observacion?.Trim(),
                UserId = usuarioId
            };

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();

            return StatusCode(StatusCodes.Status201Created, pedido);
        }

        [HttpGet]
        public async Task<ActionResult<List<Pedido>>> ObtenerPedidos()
        {
            var consulta = _context.Pedidos.AsNoTracking();

            if (!User.IsInRole(RolCocina))
            {
                var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (usuarioId == null)
                    return Unauthorized();

                consulta = consulta.Where(p => p.UserId == usuarioId);
            }

            var pedidos = await consulta
                .OrderBy(p => p.Id)
                .ToListAsync();

            return Ok(pedidos);
        }

        [HttpPatch("{id:int}/estado")]
        [Authorize(Roles = RolCocina)]
        public async Task<ActionResult<Pedido>> CambiarEstado(
            int id, ChangeStatusRequest solicitud)
        {
            var pedido = await _context.Pedidos.FindAsync(id);

            if (pedido == null)
                return NotFound("No se encontró el pedido.");

            try
            {
                pedido.CambiarEstado(solicitud.NewStatus);
            }
            catch (InvalidOperationException error)
            {
                return BadRequest(error.Message);
            }

            await _context.SaveChangesAsync();

            return Ok(pedido);
        }
    }
}