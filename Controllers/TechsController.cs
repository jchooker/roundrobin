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
using System.Diagnostics;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace TechListApp.Controllers
{
    public class TechsController : Controller
    {
        private readonly TechService _techService = new TechService();
        private readonly string _jsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/data/techs.json");
        private Dictionary<int, int> idToQueueIdMap = new Dictionary<int, int>();
        private Dictionary<int, int> queueIdToIdMap = new Dictionary<int, int>();

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
                    IsAvailable = t.IsAvailable
                }).OrderBy(t => t.Id).ToList();

                foreach (var tech in techs)
                {
                    // Check for duplicate Ids
                    if (!idToQueueIdMap.ContainsKey(tech.Id))
                    {
                        idToQueueIdMap.Add(tech.Id, tech.QueueId);
                    }
                    else
                    {
                        Console.WriteLine($"Duplicate Id found: {tech.Id} with QueueId: {tech.QueueId}");
                    }

                    // Check for duplicate QueueIds
                    if (!queueIdToIdMap.ContainsKey(tech.QueueId))
                    {
                        queueIdToIdMap.Add(tech.QueueId, tech.Id);
                    }
                    else
                    {
                        Console.WriteLine($"Duplicate QueueId found: {tech.QueueId} with Id: {tech.Id}");
                    }
                }

                int availableCount = techs.Count(t => t.IsAvailable);

                for (int i = 0; i < techs.Count; i++)
                {
                    techs[i].QueueId = i; //mostly going to be using queueid to refer to specific buttons
                    techs[i].IsOnlyOneAvailable = (techs[i].IsAvailable && availableCount == 1);
                }

                //int lastSelectedIndex = idToQueueIdMap.ContainsKey(data.LastSelectedId) ? idToQueueIdMap[data.LastSelectedId] : 1; //queueid
                //int prevLastSelectedIndex = idToQueueIdMap.ContainsKey(data.PrevLastSelectedId) ? idToQueueIdMap[data.PrevLastSelectedId] : 0; //queueid
                //$$$$$$$$$$$$$$$$$$$$$$^^reactivate these soon?
                int lastSelectedIndex;
                if (!idToQueueIdMap.TryGetValue(data.LastSelectedId, out lastSelectedIndex))
                {
                    lastSelectedIndex = 1;
                }
                int prevLastSelectedIndex;
                if (!idToQueueIdMap.TryGetValue(data.PrevLastSelectedId, out prevLastSelectedIndex))
                {
                    prevLastSelectedIndex = 0;
                }
                //int lastSelectedIndex = techs.FindIndex(t => t.Id == data.LastSelectedId);
                //if (lastSelectedIndex == -1)
                //{
                //    lastSelectedIndex = 1;
                //    //throw new InvalidOperationException("Last selected ID does not exist in the techs collection.");
                //}

                //int prevLastSelectedIndex = techs.FindIndex(t => t.Id == data.PrevLastSelectedId);

                //int lastSelectedIndexDebug = techs.FindIndex(t => t.Id == data.LastSelectedId);
                //int prevLastSelectedIndexDebug = techs.FindIndex(t => t.Id == data.PrevLastSelectedId);

                Debug.WriteLine($"LastSelectedId: {data.LastSelectedId}, LastSelectedIndex: {lastSelectedIndex}");
                Debug.WriteLine($"PrevLastSelectedId: {data.PrevLastSelectedId}, PrevLastSelectedIndex: {prevLastSelectedIndex}");

                //bool isOnlyOneAvailable = techs.Count(t);

                JsonResult result = CalculateCurrentSelectee(techs, data.LastSelectedId, data.PrevLastSelectedId);

                int currSelecteeQueueId = -1;

                //extract queueId from result
                dynamic jsonResponse = result.Value;

                if (jsonResponse.success)
                {
                    currSelecteeQueueId = jsonResponse.queueId;
                }
                else
                {
                    return result;
                }

                //map to view model
                var viewModel = new QueueViewModel
                {
                    Techs = techs,
                    LastSelectedIndex = lastSelectedIndex, //obtain from persistent source
                    CurrentSelectee = currSelecteeQueueId,
                    PrevLastSelectedIndex = prevLastSelectedIndex,
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
        public JsonResult GetAllTechViewModels()
        {
            try
            {
                var data = _techService.ReadFromJson();
                var techs = data.Techs
                    .Select(t => new TechViewModel
                    {
                        Id = t.Id,
                        Name = t.Name ?? string.Empty,
                        IsAvailable = t.IsAvailable,
                    })
                    .OrderBy(t => t.Id)
                    .ToList();

                int availableCount = techs.Count(t => t.IsAvailable);

                JsonResult result = CalculateCurrentSelectee(techs, data.LastSelectedId, data.PrevLastSelectedId);

                int currSelecteeQueueId = -1;

                //extract queueId from result
                dynamic jsonResponse = result.Value;

                if (jsonResponse.success)
                {
                    currSelecteeQueueId = jsonResponse.queueId;
                }
                else
                {
                    return result;
                }

                int lastSelectedIndex = techs.FindIndex(t => t.Id == data.LastSelectedId);
                int currentSelectee = currSelecteeQueueId;
                int prevLastSelectedIndex = techs.FindIndex(t => t.Id == data.PrevLastSelectedId);

                return Json(new {success = true, techs, lastSelectedIndex, currentSelectee, prevLastSelectedIndex});

            }
            catch (Exception ex)
            {
                return Json(new {success = false, error = ex.Message});
            }
        }

        [HttpGet]
        public IActionResult GetCurrentSelectee(int lastSelectedId, int prevLastSelectedId)
        {
            var data = _techService.ReadFromJson();

            if (data.Techs == null || !data.Techs.Any())
            {
                return Json(new { success = false, message = "No techs available." });
            }

            var techs = data.Techs
                .Select(t => new TechViewModel
                {
                    Id = t.Id,
                    Name = t.Name ?? string.Empty,
                    IsAvailable = t.IsAvailable,
                })
                .OrderBy(t => t.Id)
                .ToList();

            int availableCount = techs.Count(t => t.IsAvailable);

            for (int i = 0; i < techs.Count; i++)
            {
                techs[i].QueueId = i;
                techs[i].IsOnlyOneAvailable = (techs[i].IsAvailable && availableCount == 1);
            }

            JsonResult result = CalculateCurrentSelectee(techs, lastSelectedId, prevLastSelectedId);

            int currSelecteeQueueId = -1;

            //extract queueId from result
            dynamic jsonResponse = result.Value;

            if (jsonResponse.success)
            {
                currSelecteeQueueId = jsonResponse.queueId;
            }
            else
            {
                return result;
            }

            //var lastSelectedId = data.LastSelectedId;

            //int prevLastSelectedId = data.PrevLastSelectedId;

            // Update the last selected ID and write changes back to JSON
            data.PrevLastSelectedId = lastSelectedId;
            data.LastSelectedId = techs.First(t => t.QueueId == currSelecteeQueueId).Id; //error if negative!
            _techService.WriteToJson(data);


            return Json(new 
            { 
                success = true, 
                techs = techs, 
                lastSelectedId = data.LastSelectedId, 
                currSelectee = currSelecteeQueueId, 
                prevLastSelectedId = data.PrevLastSelectedId 
            });
        }

        private JsonResult CalculateCurrentSelectee(List<TechViewModel> techs, int lastSelectedId, int prevLastSelectedId)
            //^^lastSelected that it is provided with currently (from js) is the one that was
            //just clicked seconds ago
        {
            var availableTechs = techs.Where(t => t.IsAvailable)
                .OrderBy(t => t.QueueId)
                .ToList();

            if (!availableTechs.Any())
            {
                return Json( new { success = false, message = "No available techs to choose from!", queueId = (int?)null });
            }
            var lastSelectedTech = techs.FirstOrDefault(t => t.Id == lastSelectedId);

            if (lastSelectedTech == null)
            {
                var firstAvailableQueueId = availableTechs.First().QueueId;
                return new JsonResult(new
                {
                    success = true,
                    message = "First available tech selected as the last selected was not found.",
                    queueId = firstAvailableQueueId
                });
            }

            int lastQueueId = lastSelectedTech.QueueId;
            int availableCount = availableTechs.Count;

            //re: what follows: i'd already done >2, ==2, ==1
            //scenarios in js...?
            //if (availableCount > 2)
            //{
                int lastIndexInAvailableTechs = availableTechs.FindIndex(t => t.Id == lastSelectedId);
                int nextIndex = availableTechs[(lastIndexInAvailableTechs + 1) % availableCount].QueueId;
            //^^just let js sort out situation of ==1, ==2, >2?
            //}
            return new JsonResult(new
            {
                success = true,
                message = "Next available tech found.",
                queueId = nextIndex
            });
            //**************************************NOW LET JS SORT???????

            //for (int i = 1; i < availableCount; i++)
            //{
            //    int nextIndex = (availableTechs.IndexOf(lastSelectedTech) + i) % availableCount;
            //    return new JsonResult(new
            //    {
            //        success = true,
            //        message = "Next available tech found.",
            //        queueId = availableTechs[nextIndex].QueueId
            //    });
            //}
            //return new JsonResult(new
            //{
            //    success = true,
            //    message = "Fallback to the first available tech.",
            //    queueId = availableTechs.First().QueueId
            //});
        }

        //[HttpPost]
        //public JsonResult CalculateCurrentSelectee([FromBody] CalculateSelecteeRequest request)
        //{
        //    try
        //    {
        //        var techs = request.Techs;
        //        int lastSelectedId = request.LastSelectedId;

        //        JsonResult result = CalculateCurrentSelectee(techs, data.LastSelectedId);

        //        int currSelecteeQueueId = -1;

        //        //extract queueId from result
        //        dynamic jsonResponse = result.Value;

        //        if (jsonResponse.success)
        //        {
        //            currSelecteeQueueId = jsonResponse.queueId;
        //        }
        //        else
        //        {
        //            return result;
        //        }

        //        int currentSelectee = CalculateCurrentSelectee(techs, lastSelectedId);

        //        return Json(new { success = true, currentSelectee });

        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { success = false, error = ex.Message });
        //    }
        //}

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
                List<Tech> allTechs = data.Techs;
                return Json(new { allTechs });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        public JsonResult GetAllTechsCount()
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
        public JsonResult UpdateLastSelectedIndex(int techId)
            //the button would be unclickable if it were deactivated
        { //^^techId used to find the Tech with that Id of the tech's button that
            //just got clicked
            try
            {

                //var techs = _context.Techs.ToList(); //**REACTIVATE WITH DB
                //var techs = GetTechsFromJson(); //<--instead of techs, get JSON so we can leverage
                //...the lastselectedid value, which is outside of "techs"
                var data = _techService.ReadFromJson();
                var tech = data.Techs.FirstOrDefault(t => t.Id == techId);

                if (tech == null) return Json(new { success = false, error = "Tech not found." });

                data.PrevLastSelectedId = data.LastSelectedId;
                data.LastSelectedId = tech.Id;
                _techService.WriteToJson(data);

                return Json(new {success = true});
            } catch (Exception ex)
            {
                return Json(new {success= false, error = ex.Message});
            }

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

    public class CalculateSelecteeRequest
    {
        public List<TechViewModel> Techs { get; set; }
        public int LastSelectedId { get; set; }
        public int PrevLastSelectedId { get; set; }
    }
}
