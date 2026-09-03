using Loom.Domain.Entities.Events;

namespace Loom.Application.Interfaces.Repository;

public interface IEventRepository
{
    Task CreateAsync(Event ev, CancellationToken ct);
    Task<Event?> GetByIdAsync(int eventId, CancellationToken ct);
    Task<List<Event>> GetMyCalendarAsync(int userId, CancellationToken ct);

    Task<EventRsvp?> GetRsvpAsync(int eventId, int userId, CancellationToken ct);
    Task AddRsvpAsync(EventRsvp rsvp, CancellationToken ct);
    Task<CalendarEntry?> GetCalendarEntryAsync(int userId, int eventId, CancellationToken ct);
    Task AddCalendarEntryAsync(CalendarEntry entry, CancellationToken ct);
    Task<List<Event>> GetChatEventsAsync(int chatId, CancellationToken ct);
    Task AddShareAsync(EventShare share, CancellationToken ct);
    Task<bool> IsSharedAsync(int eventId, int chatId, CancellationToken ct);
}