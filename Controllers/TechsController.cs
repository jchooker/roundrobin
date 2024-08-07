using System;
using System.Linq;
using System.Data;
using Microsoft.AspNetCore.Mvc;
using TechListApp.Data;
using TechListApp.ViewModels;
using TechListApp.Models;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using TechListApp.Services;

namespace TechListApp.Controllers
{
    public class TechsController : Controller
    {
        private readonly TechService _techService = new TechService();
        private readonly string _jsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/data/techs.json");
        //private readonly ApplicationDbContext _context;
        //public TechsController(ApplicationDbContext context)
        //{
        //    _context = context;
        //} //*** leave all "context" out until db is in the mix

        public IActionResult Index()
        {
            try
            {
                //List<Tech> techs = GetTechsFromJson();
                //var (lastSelectedIndex, lastSelectedId) = TechListApp.Services.FileStorage.ReadState();
                var data = _techService.ReadFromJson();
                if (data.Techs == null)
                {
                    throw new InvalidOperationException("Techs list should not be null.");
                }

                //map to view model
                var viewModel = new QueueViewModel
                {
                    Techs = data.Techs.Select(t => new TechViewModel
                    {
                        Id = t.Id,
                        Name = t.Name,
                        IsHereToday = t.IsHereToday,
                        IsAvailable = t.IsAvailable,
                    }).ToList(),
                    LastSelectedIndex = data.Techs.FindIndex(t => t.Id == data.LastSelectedId) //obtain from persistent source
                };
                return View(viewModel);
            }
            catch (Exception ex)
            {
                return View("Error", new ErrorViewModel { Message = ex.Message });
            }
        }

        [HttpGet]
        public JsonResult GetAvailableTechsCount()
        {
            try
            {
                var data = _techService.ReadFromJson();
                int availableCount = data.Techs.Count(t => t.IsAvailable);
                return Json(new { availableCount });
            }
            catch (Exception ex) {
                return Json(new {success = false, error = ex.Message});
            }

            //if (data.Techs == null) MessageBox.Show("No techs available", "Null result", MessageB
        }

        [HttpPost]
        public JsonResult UpdateTechAvailability([FromBody] List<int> availableIds)
        {
            try
            {
                var data = _techService.ReadFromJson();
                foreach (var tech in data.Techs)
                {
                    tech.IsAvailable = availableIds.Contains(tech.Id);
                }
                _techService.WriteToJson(data);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult UpdateLastSelectedIndex(int techId)
        {
            //var techs = _context.Techs.ToList(); //**REACTIVATE WITH DB
            var techs = GetTechsFromJson();
            int lastSelectedIndex = techs.FindIndex(t => t.Id == techId);

            //Write state to file
            TechListApp.Services.FileStorage.WriteState(lastSelectedIndex, techId);

            return RedirectToAction("Index");
        }

        [HttpPost]
        public JsonResult ToggleAvailability(int techId)
        {
            var data = _techService.ReadFromJson();
            var tech = data.Techs.FirstOrDefault(t => t.Id == techId);
            if (tech != null)
            {
                tech.IsAvailable = !tech.IsAvailable;
                _techService.WriteToJson(data); //save changes to json
            }
            return Json(new {success = true, isAvailable = tech?.IsAvailable});
        }

        private List<Tech> GetTechsFromJson()
        {
            if (!System.IO.File.Exists(_jsonFilePath))
            {
                throw new FileNotFoundException("The necessary json data was not found.", _jsonFilePath);
            }
            string jsonData = System.IO.File.ReadAllText(_jsonFilePath);

            var techsFromJson = JsonSerializer.Deserialize<List<Tech>>(jsonData) ?? new List<Tech>();
            return techsFromJson;
        }
    }
}
