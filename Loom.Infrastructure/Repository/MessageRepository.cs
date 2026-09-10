using Loom.Application.Interfaces.Repository;
using Loom.Domain.Entities;
using Loom.Domain.Entities.Chats;
using Loom.Domain.Enums;
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
        await _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Reactions)
            .Include(m => m.ReplyToMessage).ThenInclude(r => r!.Sender)
            .FirstOrDefaultAsync(m => m.Id == messageId, ct);

    public async Task<(List<Message> items, int totalCount)> HistoryAsync(
        int chatId, int page, int pageSize, CancellationToken ct)
    {
        var query = _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Attachments)
            .Include(m => m.Reactions)
            .Include(m => m.ReplyToMessage).ThenInclude(r => r!.Sender)
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
    
    public async Task<Message?> GetLastMessageAsync(int chatId, CancellationToken ct) =>
        await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ChatId == chatId && !m.IsDeleted)
            .OrderByDescending(m => m.SentAt)
            .FirstOrDefaultAsync(ct);
    
    public async Task<int> CountUnreadAsync(int chatId, int userId, DateTime? lastReadAt, CancellationToken ct) =>
        await _context.Messages
            .Where(m => m.ChatId == chatId
                        && !m.IsDeleted
                        && m.SenderId != userId        
                        && (lastReadAt == null || m.SentAt > lastReadAt))
            .CountAsync(ct);
    
    
    public async Task<List<Message>> GetPinnedAsync(int chatId, CancellationToken ct) =>
        await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ChatId == chatId && m.IsPinned && !m.IsDeleted)
            .OrderByDescending(m => m.SentAt)
            .ToListAsync(ct);
    
    
    public async Task<(List<Message> items, int totalCount)> SearchAsync(
        int userId, string query, int? chatId, int page, int pageSize, CancellationToken ct)
    {
        var q = _context.Messages
            .Include(m => m.Sender)
            .Include(m => m.Chat).ThenInclude(c => c.Members).ThenInclude(mem => mem.User)
            .Where(m => !m.IsDeleted
                        && m.Type == MessageType.Text
                        && EF.Functions.ILike(m.Content, $"%{query}%")
                        && m.Chat.Members.Any(mem => mem.UserId == userId));

        if (chatId.HasValue)
            q = q.Where(m => m.ChatId == chatId.Value);

        var totalCount = await q.CountAsync(ct);

        var items = await q
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }
}