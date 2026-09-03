using Loom.Application.DTO;
using Loom.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[Authorize]
[Route("api/chats")]
public class ChatsController : BaseController
{
    private readonly IChatService _chatService;
    public ChatsController(IChatService chatService) => _chatService = chatService;
    [HttpPost]
    public async Task<IActionResult> Create(CreateChatDto dto, CancellationToken ct) =>
        Ok(await _chatService.CreateChat(UserId, dto, ct));
    [HttpGet]
    public async Task<IActionResult> GetMy(CancellationToken ct) =>
        Ok(await _chatService.GetMyChats(UserId, ct));
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct) =>
        Ok(await _chatService.GetChatById(UserId, id, ct));

    [HttpPost("{id}/join")]
    public async Task<IActionResult> Join(int id, CancellationToken ct)
    {
        await _chatService.JoinChat(UserId, id, ct);
        return NoContent();
    }
    [HttpPost("{id}/leave")]
    public async Task<IActionResult> Leave(int id, CancellationToken ct)
    {
        await _chatService.LeaveChat(UserId, id, ct);
        return NoContent();
    }
    [HttpGet("{id}/members")]
    public async Task<IActionResult> Members(int id, CancellationToken ct) =>
        Ok(await _chatService.GetMembers(UserId, id, ct));
}