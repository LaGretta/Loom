using Loom.Application.DTO;
using Loom.Application.Interfaces.Service;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto, CancellationToken ct) =>
        Ok(await _authService.Register(dto, ct));
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto, CancellationToken ct) =>
        Ok(await _authService.Login(dto, ct));
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string refreshToken, CancellationToken ct) =>
        Ok(await _authService.Refresh(refreshToken, ct));
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] string refreshToken, CancellationToken ct)
    {
        await _authService.Logout(refreshToken, ct);
        return NoContent();
    }
}