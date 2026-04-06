using Microsoft.AspNetCore.SignalR;

using Microsoft.AspNetCore.Authorization;

namespace NexCrm.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public async Task SendNotification(string message, string type)
    {
        await Clients.All.SendAsync("ReceiveNotification", message, type);
    }
}
