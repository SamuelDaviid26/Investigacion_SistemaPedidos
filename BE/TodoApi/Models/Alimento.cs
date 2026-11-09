using System.ComponentModel.DataAnnotations;

namespace TodoApi.Models
{
    public class Alimento
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Nombre { get; set; } = string.Empty;
    }
}