using Loom.Application.Interfaces.Repository;
using Loom.Domain.Entities;
using Loom.Domain.Enums;
using Loom.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Loom.Infrastructure.Repository;

public class UserRepository : IUserRepository
{
    private readonly LoomDbContext _context;
    public UserRepository(LoomDbContext context) => _context = context;

    public async Task<User?> GetByIdAsync(int userId, CancellationToken ct) =>
        await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

    public async Task<List<User>> SearchAsync(string query, CancellationToken ct) =>
        await _context.Users
            .Where(u => u.UserName.Contains(query) || u.DisplayName.Contains(query))
            .Take(20)
            .ToListAsync(ct);
    public async Task UpdateStatusAsync(int userId, UserStatus status, DateTime lastSeenAt, CancellationToken ct)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user != null)
        {
            user.Status = status;
            user.LastSeenAt = lastSeenAt;
        }
    }
}