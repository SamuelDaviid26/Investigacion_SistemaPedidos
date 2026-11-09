using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Models;

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/alimentos")]
    [Authorize]
    public class AlimentosController : ControllerBase
    {
        private readonly TodoDbContext _context;

        public AlimentosController(TodoDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<Alimento>>> ObtenerAlimentos()
        {
            var alimentos = await _context.Alimentos
                .AsNoTracking()
                .OrderBy(a => a.Id)
                .ToListAsync();

            return Ok(alimentos);
        }
    }
}