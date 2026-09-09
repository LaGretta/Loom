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
    
    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        await _chatService.MarkChatRead(UserId, id, ct);
        return NoContent();
    }
    
    [HttpPost("{id}/mute")]
    public async Task<IActionResult> ToggleMute(int id, CancellationToken ct) =>
        Ok(new { isMuted = await _chatService.ToggleMute(UserId, id, ct) });
    
    
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateChatDto dto, CancellationToken ct)
    {
        await _chatService.UpdateChat(UserId, id, dto, ct);
        return NoContent();
    }

    [HttpDelete("{id}/members/{targetUserId}")]
    public async Task<IActionResult> RemoveMember(int id, int targetUserId, CancellationToken ct)
    {
        await _chatService.RemoveMember(UserId, id, targetUserId, ct);
        return NoContent();
    }

    [HttpPut("{id}/members/{targetUserId}/role")]
    public async Task<IActionResult> SetRole(int id, int targetUserId, SetRoleDto dto, CancellationToken ct)
    {
        await _chatService.SetMemberRole(UserId, id, targetUserId, dto.Role, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _chatService.DeleteChat(UserId, id, ct);
        return NoContent();
    }
    
    [HttpPost("{id}/invites")]
    public async Task<IActionResult> CreateInvite(int id, CreateInviteDto dto, CancellationToken ct) =>
        Ok(await _chatService.CreateInvite(UserId, id, dto, ct));

    [HttpGet("{id}/invites")]
    public async Task<IActionResult> GetInvites(int id, CancellationToken ct) =>
        Ok(await _chatService.GetInvites(UserId, id, ct));

    [HttpDelete("invites/{code}")]
    public async Task<IActionResult> RevokeInvite(string code, CancellationToken ct)
    {
        await _chatService.RevokeInvite(UserId, code, ct);
        return NoContent();
    }

    [HttpGet("invites/{code}")]
    public async Task<IActionResult> PreviewInvite(string code, CancellationToken ct) =>
        Ok(await _chatService.PreviewInvite(UserId, code, ct));

    [HttpPost("invites/{code}/join")]
    public async Task<IActionResult> JoinByInvite(string code, CancellationToken ct) =>
        Ok(await _chatService.JoinByInvite(UserId, code, ct));
}