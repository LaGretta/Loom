using Loom.Application.DTO;
using Loom.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[Authorize]
[Route("api/users")]
public class UsersController : BaseController
{
    private readonly IUserService _userService;
    public UsersController(IUserService userService) => _userService = userService;

    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken ct) =>
        Ok(await _userService.GetMyProfile(UserId, ct));
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(UpdateProfileDto dto, CancellationToken ct) =>
        Ok(await _userService.UpdateProfile(UserId, dto, ct));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(int id, CancellationToken ct) =>
        Ok(await _userService.GetProfile(id, ct));

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query, CancellationToken ct) =>
        Ok(await _userService.Search(UserId, query, ct));
}