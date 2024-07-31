using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace TechListApp.Hubs
{
    public class ListHub : Hub
    {
        public async Task UpdateLastSelectedIndex(int index)
        {
            await Clients.All.SendAsync("ReceiveSelection", index);
        }
    }
}
