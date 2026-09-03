using Loom.Domain.Entities.Users;

namespace Loom.Domain.Entities.Events;

public class CalendarEntry
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int EventId { get; set; }
    public Event Event { get; set; } = null!;

    public DateTime AddedAt { get; set; }
}