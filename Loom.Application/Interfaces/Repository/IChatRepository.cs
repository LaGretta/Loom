using Loom.Domain.Entities;
using Loom.Domain.Entities.Chats;

namespace Loom.Application.Interfaces.Repository;

public interface IChatRepository
{
    Task CreateAsync(Chat chat, CancellationToken ct);
    Task<Chat?> GetByIdAsync(int chatId, CancellationToken ct);
    Task<List<Chat>> GetMyChatsAsync(int userId, CancellationToken ct);
    
    Task AddMemberAsync(ChatMember chatMember, CancellationToken ct);
    Task<ChatMember?> GetMemberAsync(int chatId, int userId, CancellationToken ct);
    Task<bool> IsMemberAsync(int chatId, int userId, CancellationToken ct);
    Task<List<ChatMember>> GetMembersAsync(int chatId, CancellationToken ct);
    void RemoveMember(ChatMember member);
    Task<Chat?> GetDirectChatAsync(int userId1, int userId2, CancellationToken ct);
    void Remove(Chat chat);
    
    Task AddInviteAsync(ChatInvite invite, CancellationToken ct);
    Task<ChatInvite?> GetInviteByCodeAsync(string code, CancellationToken ct);
    Task<List<ChatInvite>> GetChatInvitesAsync(int chatId, CancellationToken ct);
    Task<bool> InviteCodeExistsAsync(string code, CancellationToken ct);
}