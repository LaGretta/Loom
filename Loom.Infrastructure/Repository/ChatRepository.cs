using Loom.Application.Interfaces.Repository;
using Loom.Domain.Entities;
using Loom.Domain.Entities.Chats;
using Loom.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Loom.Infrastructure.Repository;

public class ChatRepository : IChatRepository
{
    private readonly LoomDbContext _context;
    public ChatRepository(LoomDbContext context) => _context = context;

    public async Task CreateAsync(Chat chat, CancellationToken ct) =>
        await _context.Chats.AddAsync(chat, ct);
    public async Task<Chat?> GetByIdAsync(int chatId, CancellationToken ct) =>
        await _context.Chats.Include(c => c.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(c => c.Id == chatId, ct);
   
    public async Task<List<Chat>> GetMyChatsAsync(int userId, CancellationToken ct) =>
        await _context.Chats
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .Where(c => c.Members.Any(m => m.UserId == userId))
            .ToListAsync(ct);
    
    public async Task AddMemberAsync(ChatMember chatMember, CancellationToken ct) =>
        await _context.ChatMembers.AddAsync(chatMember, ct);
    public async Task<ChatMember?> GetMemberAsync(int chatId, int userId, CancellationToken ct) =>
        await _context.ChatMembers
            .FirstOrDefaultAsync(m => m.ChatId == chatId && m.UserId == userId, ct);
    public async Task<bool> IsMemberAsync(int chatId, int userId, CancellationToken ct) =>
        await _context.ChatMembers.AnyAsync(m => m.ChatId == chatId && m.UserId == userId, ct);
    public async Task<List<ChatMember>> GetMembersAsync(int chatId, CancellationToken ct) =>
        await _context.ChatMembers.Include(m => m.User)
            .Where(m => m.ChatId == chatId).ToListAsync(ct);
    public void RemoveMember(ChatMember member) =>
        _context.ChatMembers.Remove(member);
    
    public async Task<Chat?> GetDirectChatAsync(int userId1, int userId2, CancellationToken ct) =>
        await _context.Chats
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c =>
                c.Type == Domain.Enums.ChatType.Direct &&
                c.Members.Count == 2 &&
                c.Members.Any(m => m.UserId == userId1) &&
                c.Members.Any(m => m.UserId == userId2), ct);
    
    public void Remove(Chat chat) => _context.Chats.Remove(chat);
    
    
    public async Task AddInviteAsync(ChatInvite invite, CancellationToken ct) =>
        await _context.ChatInvites.AddAsync(invite, ct);

    public async Task<ChatInvite?> GetInviteByCodeAsync(string code, CancellationToken ct) =>
        await _context.ChatInvites
            .Include(i => i.Chat).ThenInclude(c => c.Members)
            .FirstOrDefaultAsync(i => i.Code == code, ct);

    public async Task<List<ChatInvite>> GetChatInvitesAsync(int chatId, CancellationToken ct) =>
        await _context.ChatInvites
            .Where(i => i.ChatId == chatId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);

    public async Task<bool> InviteCodeExistsAsync(string code, CancellationToken ct) =>
        await _context.ChatInvites.AnyAsync(i => i.Code == code, ct);
}