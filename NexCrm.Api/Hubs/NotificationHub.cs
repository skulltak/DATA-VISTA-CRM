using Microsoft.AspNetCore.SignalR;

namespace NexCrm.Api.Hubs;

public class NotificationHub : Hub
{
    public async Task SendNotification(string message, string type)
    {
        await Clients.All.SendAsync("ReceiveNotification", message, type);
    }
}
