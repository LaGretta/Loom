using Loom.Domain.Entities.Users;
using Loom.Domain.Enums;

namespace Loom.Domain.Entities.Events;

public class EventRsvp
{
    public int Id { get; set; }

    public int EventId { get; set; }
    public Event Event { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public RsvpStatus Status { get; set; }
    public DateTime RespondedAt { get; set; }
}