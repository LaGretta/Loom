using Loom.Application.DTO;
using Loom.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[Authorize]
[Route("api/events")]
public class EventsController : BaseController
{
    private readonly IEventService _eventService;
    public EventsController(IEventService eventService) => _eventService = eventService;

    [HttpPost]
    public async Task<IActionResult> Create(CreateEventDto dto, CancellationToken ct) =>
        Ok(await _eventService.CreateEvent(UserId, dto, ct));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct) =>
        Ok(await _eventService.GetEvent(UserId, id, ct));

    [HttpGet("my")]
    public async Task<IActionResult> MyCalendar(CancellationToken ct) =>
        Ok(await _eventService.GetMyCalendar(UserId, ct));

    [HttpPost("rsvp")]
    public async Task<IActionResult> Rsvp(RsvpDto dto, CancellationToken ct) =>
        Ok(await _eventService.Rsvp(UserId, dto, ct));

    [HttpPost("{id}/add-to-calendar")]
    public async Task<IActionResult> AddToCalendar(int id, CancellationToken ct)
    {
        await _eventService.AddToMyCalendar(UserId, id, ct);
        return NoContent();
    }
    
    [HttpGet("chat/{chatId}")]
    public async Task<IActionResult> ChatEvents(int chatId, CancellationToken ct) =>
        Ok(await _eventService.GetChatEvents(UserId, chatId, ct));
}