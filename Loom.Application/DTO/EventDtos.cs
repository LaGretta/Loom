using Loom.Domain.Enums;

namespace Loom.Application.DTO;

public class CreateEventDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EventDateTime { get; set; }
    public int? ChatId { get; set; }  
}

public class RsvpDto
{
    public int EventId { get; set; }
    public RsvpStatus Status { get; set; }
}

public class EventResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EventDateTime { get; set; }
    public int CreatedById { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public int? ChatId { get; set; }
    public DateTime CreatedAt { get; set; }        

    public int GoingCount { get; set; }
    public int MaybeCount { get; set; }
    public int NotGoingCount { get; set; }
    public RsvpStatus? MyStatus { get; set; }
    public bool InMyCalendar { get; set; }

    public List<EventAttendeeDto> Attendees { get; set; } = new();   
}
public class EventAttendeeDto
{
    public int UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public RsvpStatus Status { get; set; }
}
public class ShareEventDto
{
    public int ChatId { get; set; }
}