using Microsoft.AspNetCore.Mvc;
using TechListApp.ViewModels;

namespace TechListApp.Controllers
{
    public class TechsController : Controller
    {
        private static int _lastSelectedIndex = 2;
        public IActionResult Index()
        {
            var model = new TechViewModel
            {
                Names = new List<string> { "Aaron", "Jack", "Joe", "Kurrine", "Shane" },
                LastSelectedIndex = _lastSelectedIndex
            };
            return View(model);
        }

        [HttpPost]
        public IActionResult UpdateLastSelectedIndex(int index)
        {
            _lastSelectedIndex = index;
            return Ok();
        }
    }
}
