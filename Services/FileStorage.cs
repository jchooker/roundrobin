namespace TechListApp.Services
{
    using System;
    using System.IO;
    public static class FileStorage
    {
        private static readonly string FilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/data/state.txt");

        public static (int lastSelectedIndex, int lastSelectedId) ReadState()
        {
            if (!File.Exists(FilePath))
            {
                return (-1, -1);
            }
            string[] lines = File.ReadAllLines(FilePath);
            if (lines.Length < 2)
            {
                return (-1, -1); // Default if file content is not as expected
            }
            int lastSelectedIndex = int.TryParse(lines[0], out var index) ? index : -1;
            int lastSelectedId = int.TryParse(lines[1], out var id) ? id : -1;

            return (lastSelectedIndex, lastSelectedId);
        }

        public static void WriteState(int lastSelectedIndex, int lastSelectedId)
        {
            string[] lines = { lastSelectedIndex.ToString(), lastSelectedId.ToString() };
            File.WriteAllLines(FilePath, lines);
        }
    }
}
