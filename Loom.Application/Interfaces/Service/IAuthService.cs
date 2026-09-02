using Loom.Application.DTO;

namespace Loom.Application.Interfaces.Service;

public interface IAuthService
{
    Task<AuthResponseDto> Register(RegisterDto dto , CancellationToken ct);
    Task<AuthResponseDto> Login(LoginDto dto, CancellationToken ct);
    Task<AuthResponseDto> Refresh(string refreshToken, CancellationToken ct);
    Task Logout(string refreshToken,CancellationToken ct);
} 