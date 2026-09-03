using Loom.Application.Interfaces.Repository;
using Loom.Domain.Entities;
using Loom.Domain.Entities.Users;
using Loom.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Loom.Infrastructure.Repository;

public class AuthRepository : IAuthRepository
{
    private readonly LoomDbContext _context;
    public AuthRepository(LoomDbContext context)
    {
        _context = context;
    }
    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken ct)
        => await _context.Users.AnyAsync(n => n.Email == email, ct);
    public async Task<bool> ExistsByUserNameAsync(string userName, CancellationToken ct)
        => await _context.Users.AnyAsync(n => n.UserName == userName, ct);
    public async Task<User?> GetUserByEmailAsync(string email, CancellationToken ct)
    =>  await _context.Users.FirstOrDefaultAsync(n => n.Email == email, ct);
    public async Task AddUserAsync(User user, CancellationToken ct)
        => await _context.Users.AddAsync(user, ct);
    public async Task AddRefreshTokenAsync(RefreshToken token, CancellationToken ct)
    => await _context.RefreshTokens.AddAsync(token, ct);
    public async Task<RefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct)
    => await _context.RefreshTokens.Include(n => n.User)
        .FirstOrDefaultAsync(n => n.Token == token, ct);
}