namespace Loom.Domain.Entities.Events;

public class EventShare
{
    public int Id {get; set;}
    
    public int EventId {get; set;}
    public Event Event { get; set; } = null!;
    
    public int ChatId { get; set; }
    public int SharedById { get; set; }
    public DateTime SharedAt { get; set; }
}