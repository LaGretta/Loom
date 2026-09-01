
using Loom.Domain.Entities;

namespace Loom.Application.Interfaces.Repository;

public interface IAuthRepository
{
   Task<bool> ExistsByEmailAsync(string email, CancellationToken ct);
   Task<bool> ExistsByUserNameAsync(string userName, CancellationToken ct);
   Task<User?> GetUserByEmailAsync(string email , CancellationToken ct);
   Task AddUserAsync(User user, CancellationToken ct);
   
   Task AddRefreshTokenAsync(RefreshToken token, CancellationToken ct);
   Task<RefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct);
}