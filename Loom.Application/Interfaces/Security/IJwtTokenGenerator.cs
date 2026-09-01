using Loom.Domain.Entities;

namespace Loom.Application.Interfaces.Security;

public interface IJwtTokenGenerator
{
    string GenerateJwtToken(User user);
    string GenerateRefreshToken();
}