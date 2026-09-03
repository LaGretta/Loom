using Loom.Application.DTO;
using Loom.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[Authorize]
[Route("api/messages")]
public class MessagesController : BaseController
{
    private readonly IMessageService _messageService;
    public MessagesController(IMessageService messageService) => _messageService = messageService;
    [HttpPost]
    public async Task<IActionResult> Send(SendMessageDto dto, CancellationToken ct) =>
        Ok(await _messageService.SendMessage(UserId, dto, ct));
    [HttpGet("chat/{chatId}")]
    public async Task<IActionResult> History(int chatId, [FromQuery] int page = 1, [FromQuery] int pageSize = 30, CancellationToken ct = default) =>
        Ok(await _messageService.GetHistory(UserId, chatId, page, pageSize, ct));
    [HttpPut]
    public async Task<IActionResult> Edit(EditMessageDto dto, CancellationToken ct) =>
        Ok(await _messageService.EditMessage(UserId, dto, ct));
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _messageService.DeleteMessage(UserId, id, ct);
        return NoContent();
    }
    [HttpPost("{id}/read")]
    public async Task<IActionResult> Read(int id, CancellationToken ct)
    {
        await _messageService.MarkAsRead(UserId, id, ct);
        return NoContent();
    }
    [HttpPost("reaction")]
    public async Task<IActionResult> Reaction(ToggleReactionDto dto, CancellationToken ct)
    {
        await _messageService.ToggleReaction(UserId, dto, ct);
        return NoContent();
    }
}