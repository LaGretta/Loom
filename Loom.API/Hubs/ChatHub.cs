using System.Security.Claims;
using Loom.Application.Interfaces.Repository;
using Loom.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Loom.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IUserRepository _userRepo;

    public ChatHub(IUserRepository userRepo)
    {
        _userRepo = userRepo;
    }
    private int UserId =>
        int.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public override async Task OnConnectedAsync()
    {
        await _userRepo.UpdateStatusAsync(UserId, UserStatus.Online, DateTime.UtcNow, default);
        await Clients.All.SendAsync("UserOnline", UserId);
        await base.OnConnectedAsync();
    }
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await _userRepo.UpdateStatusAsync(UserId, UserStatus.Offline, DateTime.UtcNow, default);
        await Clients.All.SendAsync("UserOffline", UserId, DateTime.UtcNow);
        await base.OnDisconnectedAsync(exception);
    }
    public async Task JoinChat(int chatId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"chat-{chatId}");

    public async Task LeaveChat(int chatId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"chat-{chatId}");

    public async Task Typing(int chatId) =>
        await Clients.OthersInGroup($"chat-{chatId}").SendAsync("UserTyping", chatId, UserId);
}