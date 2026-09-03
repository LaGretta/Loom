using Loom.Domain.Entities;
using Loom.Domain.Entities.Users;
using Loom.Domain.Enums;

namespace Loom.Application.Interfaces.Repository;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken ct);
    Task<List<User>> SearchAsync(string query, CancellationToken ct);
    Task UpdateStatusAsync(int userId, UserStatus status, DateTime lastSeenAt, CancellationToken ct);
}