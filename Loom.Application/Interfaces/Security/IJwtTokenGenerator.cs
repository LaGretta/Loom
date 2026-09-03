using Loom.Domain.Entities;
using Loom.Domain.Entities.Users;

namespace Loom.Application.Interfaces.Security;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}