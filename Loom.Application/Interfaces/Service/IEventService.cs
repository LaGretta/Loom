using Loom.Application.DTO;

namespace Loom.Application.Interfaces.Service;

public interface IEventService
{
    Task<EventResponseDto> CreateEvent(int userId, CreateEventDto dto, CancellationToken ct);
    Task<EventResponseDto> Rsvp(int userId, RsvpDto dto, CancellationToken ct);
    Task AddToMyCalendar(int userId, int eventId, CancellationToken ct);
    Task<List<EventResponseDto>> GetMyCalendar(int userId, CancellationToken ct);
    Task<EventResponseDto> GetEvent(int userId, int eventId, CancellationToken ct);
    Task<List<EventResponseDto>> GetChatEvents(int userId, int chatId, CancellationToken ct);
    Task ShareToChat(int userId, int eventId, int chatId, CancellationToken ct);
}