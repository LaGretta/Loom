using Loom.Domain.Entities;
using Loom.Domain.Entities.Chats;

namespace Loom.Application.Interfaces.Repository;

public interface IMessageRepository
{
    Task CreateAsync(Message message, CancellationToken ct);
    Task<Message?> GetByIdAsync(int messageId, CancellationToken ct);
    Task<(List<Message> items, int totalCount)> HistoryAsync(int chatId, int page, int pageSize, CancellationToken ct);

    Task AddReactionAsync(MessageReaction messageReaction, CancellationToken ct);
    Task<MessageReaction?> GetReactionAsync(int messageId, int userId, string emoji, CancellationToken ct);
    void RemoveReaction(MessageReaction messageReaction);

    Task AddReadReceiptAsync(MessageReadReceipt receipt, CancellationToken ct);
    Task<bool> HasReadReceiptAsync(int messageId, int userId, CancellationToken ct);
    Task<Message?> GetLastMessageAsync(int chatId, CancellationToken ct);
    Task<int> CountUnreadAsync(int chatId, DateTime? lastReadAt, CancellationToken ct);
}