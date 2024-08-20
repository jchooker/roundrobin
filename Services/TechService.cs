using System.Text.Json;
using System.Text.Json.Serialization;
using TechListApp.Models;

namespace TechListApp.Services
{
    public class TechData
    {
        public int LastSelectedId { get; set; }
        public int PrevLastSelectedId { get; set; }
        [JsonPropertyName("techs")]
        public List<Tech> Techs { get; set; } = new List<Tech>();
    }

    public class TechService
    {
        private static readonly string jsonPathStr = "wwwroot/data/techs.json";
        private static readonly string JsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), jsonPathStr);
        private static readonly object fileLock = new object();

        public TechData ReadFromJson()
        {
            try
            {
                //lock (fileLock)
                //{
                    Console.WriteLine("Acquired lock for reading JSON.");
                    if (!System.IO.File.Exists(JsonFilePath))
                    {
                        //return default data if file does not exist
                        throw new FileNotFoundException("The JSON data file was not found.");
                    }
                    using (var stream = new FileStream(JsonFilePath, FileMode.Open, FileAccess.Read, FileShare.None))
                    using (var reader = new StreamReader(stream))
                    {
                        string jsonData = reader.ReadToEnd();
                        Console.WriteLine("Successfully read from JSON.");
                        return JsonSerializer.Deserialize<TechData>(jsonData);
                        //var options = new JsonSerializerOptions
                        //{
                        //    PropertyNameCaseInsensitive = true
                        //};
                        //return JsonSerializer.Deserialize<TechData>(jsonData, options) ?? new TechData { LastSelectedId = -1, Techs = new List<Tech>() };
                        
                    }   
                //}
            } catch (Exception ex)
            {
                Console.WriteLine($"Error reading from JSON: {ex.Message}");
                return new TechData();
            }
        }

        public void WriteToJson(TechData data)
        {
            try
            {
                //lock (fileLock)
                //{
                //    var jsonData = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
                //    File.WriteAllText(JsonFilePath, jsonData);
                using (var stream = new FileStream(JsonFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var writer = new StreamWriter(stream))
                {
                    string jsonData = JsonSerializer.Serialize(data);
                    writer.Write(jsonData);
                }
                //}
            } catch (Exception ex)
            {
                Console.WriteLine($"Error writing to JSON: {ex.Message}");
            }
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
            data.PrevLastSelectedId = data.LastSelectedId;
            data.LastSelectedId = techId;
            WriteToJson(data);
        }
    }
}
