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
                //if (data.Techs == null)
                //{
                //    throw new InvalidOperationException("Techs list should not be null.");
                //}
                if (data.Techs == null || !data.Techs.Any())
                {
                    throw new InvalidOperationException("Techs data is null or empty.");
                }

                var techs = data.Techs.Select(t => new TechViewModel
                {
                    Id = t.Id,
                    Name = t.Name ?? string.Empty,
                    IsHereToday = t.IsHereToday,
                    IsAvailable = t.IsAvailable
                }).OrderBy(t => t.Name ?? string.Empty).ToList();

                int availableCount = techs.Count(t => t.IsAvailable);

                for (int i = 0; i < techs.Count; i++)
                {
                    techs[i].QueueId = i; //mostly going to be using queueid to refer to specific buttons
                    techs[i].IsOnlyOneAvailable = (techs[i].IsAvailable && availableCount == 1);
                }


                int lastSelectedIndex = techs.FindIndex(t => t.Id == data.LastSelectedId);
                if (lastSelectedIndex == -1)
                {
                    lastSelectedIndex = 1;
                    //throw new InvalidOperationException("Last selected ID does not exist in the techs collection.");
                }

                //map to view model
                var viewModel = new QueueViewModel
                {
                    Techs = techs,
                    LastSelectedIndex = lastSelectedIndex, //obtain from persistent source
                    CurrentSelectee = CalculateCurrentSelectee(techs, data.LastSelectedId),
                    HasReachedMinimumActiveTechs = availableCount <= 1
                    //Techs = data.Techs.Select(t => new TechViewModel
                    //{
                    //    Id = t.Id,
                    //    Name = t.Name,
                    //    IsHereToday = t.IsHereToday,
                    //    IsAvailable = t.IsAvailable,
                    //}).ToList(),
                    //LastSelectedIndex = data.Techs.FindIndex(t => t.Id == data.LastSelectedId), //obtain from persistent source
                    //HasReachedMinimumActiveTechs = hasReachedMinimumActiveTechs
                };
                return View(viewModel);
            }
            catch (Exception ex)
            {
                return View("Error", new ErrorViewModel { Message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetCurrentSelectee()
        {
            var data = _techService.ReadFromJson();

            if (data.Techs == null || !data.Techs.Any())
            {
                return BadRequest("No techs available.");
            }

            var techs = data.Techs
                .Select(t => new TechViewModel
                {
                    Id = t.Id,
                    Name = t.Name ?? string.Empty,
                    IsHereToday = t.IsHereToday,
                    IsAvailable = t.IsAvailable,
                })
                .OrderBy(t => t.Name ?? string.Empty)
                .ToList();

            int availableCount = techs.Count(t => t.IsAvailable);

            for (int i = 0; i < techs.Count; i++)
            {
                techs[i].QueueId = i;
                techs[i].IsOnlyOneAvailable = (techs[i].IsAvailable && availableCount == 1);
            }

            int currSelectee = CalculateCurrentSelectee(techs, data.LastSelectedId);

            // Update the last selected ID and write changes back to JSON
            data.LastSelectedId = techs[currSelectee].Id;
            _techService.WriteToJson(data);


            return Ok(currSelectee);
        }

        private int CalculateCurrentSelectee(List<TechViewModel> techs, int lastSelectedId)
        {
            var lastSelectedTech = techs.FirstOrDefault(t => t.Id == lastSelectedId);
            if (lastSelectedTech == null) return techs.FirstOrDefault(t => t.IsAvailable)?.QueueId ?? 0;

            int lastQueueId = lastSelectedTech.QueueId;
            for (int i = (lastQueueId + 1) % techs.Count; i != lastQueueId; i = (i + 1) % techs.Count)
            {
                if (techs[i].IsAvailable)
                {
                    return techs[i].QueueId;
                }
            }
            return lastQueueId;
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
        //[HttpGet]
        //public JsonResult GetTechById(int id)
        //{
        //    try
        //    {
        //        var data = _techService.ReadFromJson();
        //        return data.Techs.FirstOrDefault(t =>)
        //    }
        //}

        [HttpGet]
        public JsonResult GetAllTechs()
        {
            try
            {
                var data = _techService.ReadFromJson();
                int allTechsCount = data.Techs.Count;
                return Json(new { allTechsCount });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, error = ex.Message });
            }
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
            try
            {
                var data = _techService.ReadFromJson();

                //count # currently available
                int availableCount = data.Techs.Count(t => t.IsAvailable);

                //find data to be toggled
                var tech = data.Techs.FirstOrDefault(t => t.Id == techId);
                if (tech == null) return Json(new { success = false, error = "Tech not found." });
                if (availableCount <= 1 && tech.IsAvailable) return Json(new { success = false, error = "Cannot deactivate the last tech." });
                //^^IMPORTANT: the language of this error is what client side is using to issue proper alerts
                //otherwise, toggle
                tech.IsAvailable = !tech.IsAvailable;
                _techService.WriteToJson(data); //save changes to json
                return Json(new {success = true, isAvailable = tech?.IsAvailable});
            }
            catch (Exception ex)
            {
                return Json(new {success = false, error = ex.Message});
            }
        }

        [HttpPost]
        public JsonResult ToggleMinimumTechStaffing([FromBody] List<int> availableIds)
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
