using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Loom.API.Hubs;

public class ChatNotifier : IChatNotifier
{
    private readonly IHubContext<ChatHub> _hub;
    public ChatNotifier(IHubContext<ChatHub> hub) => _hub = hub;

    public async Task MessageSent(int chatId, MessageResponseDto message) =>
        await _hub.Clients.Group($"chat-{chatId}").SendAsync("NewMessage", message);
}