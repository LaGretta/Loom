using Loom.Application.Interfaces.Repository;
using Loom.Domain.Entities;
using Loom.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Loom.Infrastructure.Repository;

public class MessageRepository : IMessageRepository
{
    private readonly LoomDbContext _context;
    public MessageRepository(LoomDbContext context) => _context = context;

    public async Task CreateAsync(Message message, CancellationToken ct) =>
        await _context.Messages.AddAsync(message, ct);
    public async Task<Message?> GetByIdAsync(int messageId, CancellationToken ct) =>
        await _context.Messages.FirstOrDefaultAsync(m => m.Id == messageId, ct);

    public async Task<(List<Message> items, int totalCount)> HistoryAsync(
        int chatId, int page, int pageSize, CancellationToken ct)
    {
        var query = _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Attachments)
            .Where(m => m.ChatId == chatId);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(m => m.SentAt)   
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }
    public async Task AddReactionAsync(MessageReaction reaction, CancellationToken ct) =>
        await _context.MessageReactions.AddAsync(reaction, ct);
    public async Task<MessageReaction?> GetReactionAsync(int messageId, int userId, string emoji, CancellationToken ct) =>
        await _context.MessageReactions
            .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji, ct);
    public void RemoveReaction(MessageReaction reaction) =>
        _context.MessageReactions.Remove(reaction);
    public async Task AddReadReceiptAsync(MessageReadReceipt receipt, CancellationToken ct) =>
        await _context.MessageReadReceipts.AddAsync(receipt, ct);

    public async Task<bool> HasReadReceiptAsync(int messageId, int userId, CancellationToken ct) =>
        await _context.MessageReadReceipts.AnyAsync(r => r.MessageId == messageId && r.UserId == userId, ct);
}