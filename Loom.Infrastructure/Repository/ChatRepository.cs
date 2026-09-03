using Loom.Application.Interfaces.Repository;
using Loom.Domain.Entities;
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
            .FirstOrDefaultAsync(c => c.Id == chatId, ct);
    public async Task<List<Chat>> GetMyChatsAsync(int userId, CancellationToken ct) =>
        await _context.Chats
            .Include(c => c.Members)
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
}