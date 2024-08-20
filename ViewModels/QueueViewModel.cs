namespace TechListApp.ViewModels
{
    public class QueueViewModel
    {
        public List<TechViewModel> Techs { get; set; } = new List<TechViewModel>();
        public int LastSelectedIndex { get; set; }
        public int PrevLastSelectedIndex { get; set; }
        public int CurrentSelectee { get; set; }
    }
}
