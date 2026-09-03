using Loom.Application.Interfaces.Repository;
using Loom.Domain.Entities.Events;
using Loom.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Loom.Infrastructure.Repository;

public class EventRepository : IEventRepository
{
    private readonly LoomDbContext _context;
    public EventRepository(LoomDbContext context) => _context = context;

    public async Task CreateAsync(Event ev, CancellationToken ct) =>
        await _context.Events.AddAsync(ev, ct);

    public async Task<Event?> GetByIdAsync(int eventId, CancellationToken ct) =>
        await _context.Events
            .Include(e => e.CreatedBy)
            .Include(e => e.Rsvps).ThenInclude(r => r.User) 
            .Include(e => e.CalendarEntries)
            .FirstOrDefaultAsync(e => e.Id == eventId, ct);

    public async Task<List<Event>> GetMyCalendarAsync(int userId, CancellationToken ct) =>
        await _context.Events
            .Include(e => e.CreatedBy)
            .Include(e => e.Rsvps)
            .Include(e => e.CalendarEntries)
            .Where(e => e.CreatedById == userId || e.CalendarEntries.Any(c => c.UserId == userId))
            .OrderBy(e => e.EventDateTime)
            .ToListAsync(ct);

    public async Task<EventRsvp?> GetRsvpAsync(int eventId, int userId, CancellationToken ct) =>
        await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId, ct);

    public async Task AddRsvpAsync(EventRsvp rsvp, CancellationToken ct) =>
        await _context.EventRsvps.AddAsync(rsvp, ct);

    public async Task<CalendarEntry?> GetCalendarEntryAsync(int userId, int eventId, CancellationToken ct) =>
        await _context.CalendarEntries
            .FirstOrDefaultAsync(c => c.UserId == userId && c.EventId == eventId, ct);

    public async Task AddCalendarEntryAsync(CalendarEntry entry, CancellationToken ct) =>
        await _context.CalendarEntries.AddAsync(entry, ct);
    
    public async Task<List<Event>> GetChatEventsAsync(int chatId, CancellationToken ct) =>
        await _context.Events
            .Include(e => e.CreatedBy)
            .Include(e => e.Rsvps).ThenInclude(r => r.User)
            .Include(e => e.CalendarEntries)
            .Where(e => e.ChatId == chatId)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync(ct);
}