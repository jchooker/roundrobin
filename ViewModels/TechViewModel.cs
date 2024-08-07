using Microsoft.Identity.Client;
using System.ComponentModel.DataAnnotations;

namespace TechListApp.ViewModels
{
    public class TechViewModel
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsHereToday { get; set; } = true;
        public bool IsAvailable { get; set; } = true;
        public bool IsActive => IsHereToday && IsAvailable;
    }

}
