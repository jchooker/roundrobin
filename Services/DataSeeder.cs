using System.Text.Json;
using TechListApp.Data;
using TechListApp.Models;

namespace TechListApp.Services
{
    public static class DataSeeder
    {
        private static readonly string JsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/data/techs.json");
        //public static void SeedDatabase(ApplicationDbContext context, string jsonFilePath)
        public static TechData LoadData()
        {
            if(!File.Exists(JsonFilePath))
            {
                var defaultData = new TechData
                {
                    LastSelectedId = -1,
                    Techs = new List<Tech>
                    {

                    }
                };
            }
            return new TechData();
        }
    }
}
