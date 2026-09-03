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

    public async Task MessageEdited(int chatId, MessageResponseDto message) =>
        await _hub.Clients.Group($"chat-{chatId}").SendAsync("MessageEdited", message);
    public async Task MessageDeleted(int chatId, int messageId) =>
        await _hub.Clients.Group($"chat-{chatId}").SendAsync("MessageDeleted", messageId);
    public async Task ReactionUpdated(int chatId, int messageId) =>
        await _hub.Clients.Group($"chat-{chatId}").SendAsync("ReactionUpdated", messageId);
    
    public async Task MessageRead(int chatId, int messageId, int userId) =>
        await _hub.Clients.Group($"chat-{chatId}").SendAsync("MessageRead", messageId, userId);
}