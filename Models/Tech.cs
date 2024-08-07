﻿using System.ComponentModel.DataAnnotations;

namespace TechListApp.Models
{
    public class Tech
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsCurrentAssignee { get; set; }
        public bool IsHereToday { get; set; } = true;
        public bool IsAvailable { get; set; } = true;

        public Tech()
        {
            IsHereToday = true;
        }
    }
}
