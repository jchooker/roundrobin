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
using Newtonsoft.Json;

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
                Console.WriteLine(data);
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
                int availableCount = techs.Count(t => t.IsAvailable);

                for (int i = 0; i < techs.Count; i++)
                {
                    techs[i].QueueId = i; //mostly going to be using queueid to refer to specific buttons
                    techs[i].IsOnlyOneAvailable = (techs[i].IsAvailable && availableCount == 1);
                }

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
                    Console.WriteLine(tech.QueueId);
                    if (!queueIdToIdMap.ContainsKey(tech.QueueId))
                    {
                        queueIdToIdMap.Add(tech.QueueId, tech.Id);
                    }
                    else
                    {
                        Console.WriteLine($"Duplicate QueueId found: {tech.QueueId} with Id: {tech.Id}");
                    }
                }
                Console.WriteLine(idToQueueIdMap);
                Console.WriteLine(queueIdToIdMap);

                //int lastSelectedIndex = idToQueueIdMap.ContainsKey(data.LastSelectedId) ? idToQueueIdMap[data.LastSelectedId] : 1; //queueid
                //int prevLastSelectedIndex = idToQueueIdMap.ContainsKey(data.PrevLastSelectedId) ? idToQueueIdMap[data.PrevLastSelectedId] : 0; //queueid
                //$$$$$$$$$$$$$$$$$$$$$$^^reactivate these soon?
                int currSelecteeIndex;
                if (!idToQueueIdMap.TryGetValue(data.CurrentSelectee, out currSelecteeIndex))
                {
                    currSelecteeIndex = 2;
                }
                else
                {
                    currSelecteeIndex = idToQueueIdMap[data.CurrentSelectee];
                }
                int lastSelectedIndex;
                if (!idToQueueIdMap.TryGetValue(data.LastSelectedId, out lastSelectedIndex))
                {
                    lastSelectedIndex = 0;
                }
                else
                {
                    Console.WriteLine("correct last val procedure step 1 done.");
                    lastSelectedIndex = idToQueueIdMap[data.LastSelectedId];
                }
                int prevLastSelectedIndex;
                if (!idToQueueIdMap.TryGetValue(data.PrevLastSelectedId, out prevLastSelectedIndex))
                {
                    prevLastSelectedIndex = 3;
                }
                else
                {
                    Console.WriteLine("correct PREV last val procedure step 1 done.");
                    prevLastSelectedIndex = idToQueueIdMap[data.PrevLastSelectedId];
                }

                Debug.WriteLine($"LastSelectedId: {data.LastSelectedId}, LastSelectedIndex: {lastSelectedIndex}");
                Debug.WriteLine($"PrevLastSelectedId: {data.PrevLastSelectedId}, PrevLastSelectedIndex: {prevLastSelectedIndex}");

                var viewModel = new QueueViewModel
                {
                    Techs = techs,
                    LastSelectedIndex = lastSelectedIndex, //obtain from persistent source
                    CurrentSelectee = currSelecteeIndex,
                    PrevLastSelectedIndex = prevLastSelectedIndex,
                };
                //...List<TechViewModel> directly accessible
                return View(viewModel);
            }
            catch (Exception ex)
            {
                return View("Error", new ErrorViewModel { Message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult UpdateQueueViewModel([FromBody] QueueViewModel updatedViewModel)
        {
            if (ModelState.IsValid)
            {
                var data = new TechData
                {
                    LastSelectedId = queueIdToIdMap[updatedViewModel.LastSelectedIndex],
                    PrevLastSelectedId = queueIdToIdMap[updatedViewModel.PrevLastSelectedIndex],
                    Techs = updatedViewModel.Techs.Select(t => new Tech
                    {
                        Id = t.Id,
                        Name = t.Name,
                        IsAvailable = t.IsAvailable
                    }).ToList()
                };

                _techService.WriteToJson(data);

                return Json(new { success = true });
            }
            return Json(new { success = false, error = "Invalid data" });
        }

        [HttpPost]
        public IActionResult PrepareDataForApproval([FromBody] TechViewModelData techs)
        {
            if (techs?.TechViewModels == null || !techs.TechViewModels.Any())
            {
                return Json(new { success = false, message = "No techs available." });
            }
            //if (techs.TechViewModels.Count > 0)
            //{
            //    return Json(new { success = false, message = $"tech value check: curr = {techs.CurrentSelectee} \n last = {techs.LastSelectedId} \n prev = {techs.PrevLastSelectedId}" });
            //}
            var isToggleRequest = techs.IsToggleRequest;
            var techViewModels = techs.TechViewModels;
            var toggleTechId = techs.ToggleTechId;
            var currSelecteeQueueId = techs.CurrentSelectee;

            var data = _techService.ReadFromJson();
            var techInData = data.Techs.Find(t => t.Id == toggleTechId);
            var techInViewModel = techs.TechViewModels.Find(t => t.Id == toggleTechId);

            if (techInData == null || techInViewModel == null)
            {
                return Json(new { success = false, message = "Technician not found in data." });
            }

            if (data.Techs.Count(t => t.IsAvailable == true) <= 1)
            {
                return Json(new { success = false, message = "Cannot deactivate the last technician!" });
            }
            //var prevLastSelectedId = techs.PrevLastSelectedId;

            //var techViewModels = data.Techs.Select(t => new TechViewModel
            //{
            //    Id = t.Id,
            //    Name = t.Name,
            //    IsAvailable = t.IsAvailable,
            //    QueueId = techs.TechViewModels.FirstOrDefault(vm => vm.Id == t.Id)?.QueueId ?? 0
            //}).ToList();


            if (isToggleRequest.HasValue && isToggleRequest.Value)
            {
                techInData.IsAvailable = !techInData.IsAvailable;
                techInViewModel.IsAvailable = techInData.IsAvailable;
                //var techToToggle = techViewModels.FirstOrDefault(t => t.Id == currSelecteeQueueId);

                //below if toggled tech is deactivated && tech is current selectee
                if (!techInData.IsAvailable && currSelecteeQueueId == techInViewModel.QueueId)
                {
                    //if (currSelecteeQueueId == techInData.QueueId)
                    //{
                    //    techInViewModel.IsAvailable = techInData.IsAvailable;

                    //}
                    //JsonResult nextTech = GetCurrentSelectee(techs, true);
                    var availableTechs = techViewModels
                        .Where(t => t.IsAvailable)
                        .OrderBy(t => t.QueueId)
                        .ToList();
                    //_techService.WriteToJson(data);

                    if (availableTechs.Any())
                    {
                        var nextAvailableTech = availableTechs
                            .FirstOrDefault(t => t.QueueId > techInViewModel.QueueId) ?? availableTechs.First();

                        data.CurrentSelectee = nextAvailableTech.Id;
                        techs.CurrentSelectee = nextAvailableTech.QueueId;
                    }
                    else
                    {
                        return Json(new { success = false, message = "No available techs found after toggle." });
                    }

                }

                //var techViewModels = data.Techs.Select(t =>
                //{
                //    var vm = techs.TechViewModels.Find(vm => vm.Id == t.Id);
                //    return new TechViewModel
                //    {
                //        Id = t.Id,
                //        Name = t.Name,
                //        IsAvailable = t.IsAvailable,
                //        QueueId = vm != null ? vm.QueueId : 0
                //    };
                //}).ToList();

                // Serialize the updated data for user approval
                string jsonData = System.Text.Json.JsonSerializer.Serialize(data);

                //int currSelecteeIndex = availableTechs.FindIndex(t => t.Id == currSelecteeId);
                //^^for finding the first index of availableTechs to begin iteration
                return Json(new
                {
                    success = true,
                    jsonData,
                });

            }

            JsonResult result = CalculateCurrentSelectee(techs.TechViewModels, techs.LastSelectedId, techs.PrevLastSelectedId);

            Console.WriteLine(result);


            //extract queueId from result
            dynamic jsonResponse = result.Value;
            currSelecteeQueueId = -1;

            if (jsonResponse.success)
            {
                currSelecteeQueueId = jsonResponse.queueId;

                var currentTech = techs.TechViewModels.Find(t => t.QueueId == currSelecteeQueueId);
                //^^just identifying the current tech from the original bunch, "available" status
                //not necess needed

                if (currentTech != null)
                {
                    var currTechData = _techService.ReadFromJson();

                    //update json file (lastselectedid & prevlastselectedid already have this done)
                    //data.CurrentSelectee = currentTech.Id;
                    //_techService.WriteToJson(data);
                    currTechData.CurrentSelectee = currentTech.Id;
                    string jsonData = System.Text.Json.JsonSerializer.Serialize(currTechData);

                    return Json(new {success = true, jsonData});    
                }
                else
                {
                    return Json(new { success = false, message = "Failed to find current selection." });
                }

            }
            else
            {
                return result;
            }
        }

        [HttpPost]
        public IActionResult WriteApprovedData([FromBody] TechData approvedData)
        {
            try
            {
                if (approvedData == null || approvedData.Techs == null)
                {
                    Console.WriteLine("Approved data is null or incomplete.");
                    return Json(new { success = false, message = "Received null or incomplete data." });
                }
                Console.WriteLine("Data to be written: " + System.Text.Json.JsonSerializer.Serialize(approvedData));
                _techService.WriteToJson(approvedData);
                Console.WriteLine("Data written successfully to JSON.");
                return Json(new 
                { 
                    success = true, 
                    message = "Data written successfully!",
                    currentSelectee = approvedData.CurrentSelectee,
                    lastSelected = approvedData.LastSelectedId,
                    prevLastSelected = approvedData.PrevLastSelectedId
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error writing data: {ex.Message}" });
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

        [HttpPost]
        public IActionResult OverrideCurrentSelectee(int techId)
        {
            try
            {
                var data = _techService.ReadFromJson();
                var techs = data.Techs;
                if (techs == null || !techs.Any())
                {
                    return Json(new { success = false, message = "No techs available." });
                }
                var selectedTech = techs.FirstOrDefault(t => t.Id == techId);

                if (selectedTech != null)
                {
                    data.CurrentSelectee = selectedTech.Id;

                    _techService.WriteToJson(data);

                    return Json(new { success = true, message = "Current selectee has been overridden.", currentSelectee = data.CurrentSelectee });
                }
                else
                {
                    // If the techId does not match any tech
                    return Json(new { success = false, message = "Tech not found." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult GetCurrentSelectee([FromBody] TechViewModelData techs, bool? isToggleRequest)
        {
            if (techs?.TechViewModels == null || !techs.TechViewModels.Any())
            {
                return Json(new { success = false, message = "No techs available." });
            }
            //var data = _techService.ReadFromJson();
            var techViewModels = techs.TechViewModels;
            var lastSelectedId = techs.LastSelectedId;
            var currSelecteeId = techs.CurrentSelectee;
            var prevLastSelectedId = techs.PrevLastSelectedId;

            var availableTechs = techViewModels.Where(t => t.IsAvailable)
                .OrderBy(t => t.QueueId)
                .ToList();

            if (!availableTechs.Any())
            {
                return Json(new { success = false, message = "No techs available." });
            }

            if(isToggleRequest.HasValue && isToggleRequest.Value)
            {
                var currTech = availableTechs.Find(t => t.Id == currSelecteeId);
                if (currTech == null)
                {
                    return Json(new { success = false, message = "Current selectee not found." });
                }
                var nextAvailableTech = availableTechs.FirstOrDefault(t => t.QueueId > currTech.QueueId)
                        ?? availableTechs.First(); // Wrap-around to first available if none found

                //int currSelecteeIndex = availableTechs.FindIndex(t => t.Id == currSelecteeId);
                //^^for finding the first index of availableTechs to begin iteration
                return Json(new
                {
                    success = true,
                    techs = techViewModels,
                    //lastSelectedId = data.LastSelectedId, 
                    currSelectee = nextAvailableTech.QueueId,
                    //prevLastSelectedId = data.PrevLastSelectedId 
                });

            }


            //var techs = data.Techs
            //    .Select(t => new TechViewModel
            //    {
            //        Id = t.Id,
            //        Name = t.Name ?? string.Empty,
            //        IsAvailable = t.IsAvailable,
            //    })
            //    .OrderBy(t => t.Id)
            //    .ToList();

            //08/21:receives techs correctly up to this pt

            JsonResult result = CalculateCurrentSelectee(techViewModels, lastSelectedId, prevLastSelectedId);

            Console.WriteLine(result);


            //extract queueId from result
            dynamic jsonResponse = result.Value;
            int currSelecteeQueueId = -1;

            if (jsonResponse.success)
            {
                currSelecteeQueueId = jsonResponse.queueId;

                var currentTech = techViewModels.FirstOrDefault(t => t.QueueId == currSelecteeQueueId);
                //^^just identifying the current tech from the original bunch, "available" status
                //not necess needed

                if (currentTech != null)
                {
                    var data = _techService.ReadFromJson();

                    //update json file (lastselectedid & prevlastselectedid already have this done)
                    data.CurrentSelectee = currentTech.Id;
                    _techService.WriteToJson(data);
                } else
                {
                    return Json(new { success = false, message = "Failed to find current selection." });
                }

                //var lastSelectedId = data.LastSelectedId;

                //int prevLastSelectedId = data.PrevLastSelectedId;

                // Update the last selected ID and write changes back to JSON
                //data.PrevLastSelectedId = lastSelectedId;
                //data.LastSelectedId = techs.First(t => t.QueueId == currSelecteeQueueId).Id; //error if negative!
                //_techService.WriteToJson(data);


                return Json(new 
                { 
                    success = true, 
                    techs = techViewModels, 
                    //lastSelectedId = data.LastSelectedId, 
                    currSelectee = currSelecteeQueueId, 
                    //prevLastSelectedId = data.PrevLastSelectedId 
                });
            }
            else
            {
                return result;
            }

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
            //^^assembles the list of available
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

        public void SoftToggleAvailability(TechViewModel tech)
        {
            tech.IsAvailable = !tech.IsAvailable;
            //try
            //{
            //    ToggleTechAvailability(tech); // Call the internal method
            //    return Json(new { success = true, isAvailable = tech?.IsAvailable });
            //}
            //catch (Exception ex)
            //{
            //    return Json(new { success = false, error = ex.Message });
            //}
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

        private void ToggleTechAvailability(TechViewModel tech)
        {
            tech.IsAvailable = !tech.IsAvailable;
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

            var techsFromJson = System.Text.Json.JsonSerializer.Deserialize<List<Tech>>(jsonData) ?? new List<Tech>();
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
