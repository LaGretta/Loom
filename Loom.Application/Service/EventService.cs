using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Service;
using Loom.Domain.Entities.Events;
using Loom.Domain.Enums;

namespace Loom.Application.Service;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IChatNotifier _notifier;
    private readonly IChatRepository _chatRepo;

    public EventService(
        IEventRepository eventRepo
        , IUnitOfWork unitOfWork
        , IChatNotifier notifier
        , IChatRepository chatRepo)
    {
        _eventRepo = eventRepo;
        _unitOfWork = unitOfWork;
        _notifier = notifier;
        _chatRepo = chatRepo;
    }

    public async Task<EventResponseDto> CreateEvent(int userId, CreateEventDto dto, CancellationToken ct)
    {
        var ev = new Event
        {
            CreatedById = userId,
            ChatId = dto.ChatId,
            Title = dto.Title,
            Description = dto.Description,
            EventDateTime = dto.EventDateTime,
            CreatedAt = DateTime.UtcNow
        };
        await _eventRepo.CreateAsync(ev, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var result = await BuildDto(userId, ev.Id, ct);
        if (ev.ChatId.HasValue)
            await _notifier.EventShared(ev.ChatId.Value, result);
        return result;
    }

    public async Task<EventResponseDto> Rsvp(int userId, RsvpDto dto, CancellationToken ct)
    {
        var existing = await _eventRepo.GetRsvpAsync(dto.EventId, userId, ct);
        if (existing != null)
        {
            existing.Status = dto.Status;
            existing.RespondedAt = DateTime.UtcNow;
        }
        else
        {
            await _eventRepo.AddRsvpAsync(new EventRsvp
            {
                EventId = dto.EventId,
                UserId = userId,
                Status = dto.Status,
                RespondedAt = DateTime.UtcNow
            }, ct);
        }
        await _unitOfWork.SaveChangesAsync(ct);

        var result = await BuildDto(userId, dto.EventId, ct);
        var ev = await _eventRepo.GetByIdAsync(dto.EventId, ct);
        if (ev?.ChatId != null)
            await _notifier.EventUpdated(ev.ChatId.Value, result);
        return result;
    }

    public async Task AddToMyCalendar(int userId, int eventId, CancellationToken ct)
    {
        var existing = await _eventRepo.GetCalendarEntryAsync(userId, eventId, ct);
        if (existing != null) return;  

        await _eventRepo.AddCalendarEntryAsync(new CalendarEntry
        {
            UserId = userId,
            EventId = eventId,
            AddedAt = DateTime.UtcNow
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    public async Task<List<EventResponseDto>> GetMyCalendar(int userId, CancellationToken ct)
    {
        var events = await _eventRepo.GetMyCalendarAsync(userId, ct);
        return events.Select(ev => MapDto(userId, ev)).ToList();
    }

    public async Task<EventResponseDto> GetEvent(int userId, int eventId, CancellationToken ct)
    {
        return await BuildDto(userId, eventId, ct);
    }

    private async Task<EventResponseDto> BuildDto(int userId, int eventId, CancellationToken ct)
    {
        var ev = await _eventRepo.GetByIdAsync(eventId, ct);
        if (ev == null)
            throw new KeyNotFoundException("Event not found");
        return MapDto(userId, ev);
    }
    
    public async Task<List<EventResponseDto>> GetChatEvents(int userId, int chatId, CancellationToken ct)
    {
        var events = await _eventRepo.GetChatEventsAsync(chatId, ct);
        return events.Select(ev => MapDto(userId, ev)).ToList();
    }
    public async Task ShareToChat(int userId, int eventId, int chatId, CancellationToken ct)
    {
        if (!await _chatRepo.IsMemberAsync(chatId, userId, ct))
            throw new UnauthorizedAccessException("Not a member of this chat");

        var ev = await _eventRepo.GetByIdAsync(eventId, ct);
        if (ev == null)
            throw new KeyNotFoundException("Event not found");
        if (await _eventRepo.IsSharedAsync(eventId, chatId, ct))
            return;

        await _eventRepo.AddShareAsync(new EventShare
        {
            EventId = eventId,
            ChatId = chatId,
            SharedById = userId,
            SharedAt = DateTime.UtcNow
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var dto = MapDto(userId, ev);
        await _notifier.EventShared(chatId, dto);
    }
    
    private static EventResponseDto MapDto(int userId, Event ev) => new()
    {
        Id = ev.Id,
        Title = ev.Title,
        Description = ev.Description,
        EventDateTime = ev.EventDateTime,
        CreatedById = ev.CreatedById,
        CreatorName = ev.CreatedBy?.DisplayName ?? string.Empty,
        ChatId = ev.ChatId,
        CreatedAt = ev.CreatedAt,
        GoingCount = ev.Rsvps.Count(r => r.Status == RsvpStatus.Going),
        MaybeCount = ev.Rsvps.Count(r => r.Status == RsvpStatus.Maybe),
        NotGoingCount = ev.Rsvps.Count(r => r.Status == RsvpStatus.NotGoing),
        MyStatus = ev.Rsvps.FirstOrDefault(r => r.UserId == userId)?.Status,
        InMyCalendar = ev.CalendarEntries.Any(c => c.UserId == userId),
        Attendees = ev.Rsvps.Select(r => new EventAttendeeDto
        {
            UserId = r.UserId,
            DisplayName = r.User?.DisplayName ?? string.Empty,
            AvatarUrl = r.User?.AvatarUrl,
            Status = r.Status
        }).ToList()
    };
}