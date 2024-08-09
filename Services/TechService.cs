using System.Text.Json;
using System.Text.Json.Serialization;
using TechListApp.Models;

namespace TechListApp.Services
{
    public class TechData
    {
        public int LastSelectedId { get; set; }
        [JsonPropertyName("techs")]
        public List<Tech> Techs { get; set; } = new List<Tech>();
    }

    public class TechService
    {
        private static readonly string jsonPathStr = "wwwroot/data/techs.json";
        private static readonly string JsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), jsonPathStr);

        public TechData ReadFromJson()
        {
            if (!File.Exists(JsonFilePath))
            {
                //return default data if file does not exist
                throw new FileNotFoundException("The JSON data file was not found.");
            }

            var jsonData = File.ReadAllText(JsonFilePath);
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            return JsonSerializer.Deserialize<TechData>(jsonData, options) ?? new TechData { LastSelectedId = -1, Techs = new List<Tech>() };
        }

        public void WriteToJson(TechData data)
        {
            var jsonData = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(JsonFilePath, jsonData);
        }

        public void ToggleAvailability(int techId)
        {
            var data = ReadFromJson();
            var tech = data.Techs.FirstOrDefault(t => t.Id == techId);
            if (tech != null)
            {
                tech.IsAvailable = !tech.IsAvailable;
                WriteToJson(data);
            }
        }

        public void UpdateLastSelectedId(int techId)
        {
            var data = ReadFromJson();
            data.LastSelectedId = techId;
            WriteToJson(data);
        }
    }
}
