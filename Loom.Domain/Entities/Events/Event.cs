using Loom.Domain.Entities.Chats;
using Loom.Domain.Entities.Users;

namespace Loom.Domain.Entities.Events;

public class Event
{
    public int Id { get; set; }

    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;

    public int? ChatId { get; set; }       
    public Chat? Chat { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EventDateTime { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<EventRsvp> Rsvps { get; set; } = new();
    public List<EventShare> Shares { get; set; } = new();
    public List<CalendarEntry> CalendarEntries { get; set; } = new();
}