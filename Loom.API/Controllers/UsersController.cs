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
    private readonly IGiftService _giftService;
    public UsersController(
          IUserService userService
        , IGiftService giftService)
    {
        _userService = userService;
        _giftService = giftService;
    }

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
    
    [HttpGet("{id}/gifts")]
    public async Task<IActionResult> UserGifts(int id, CancellationToken ct) =>
        Ok(await _giftService.GetUserGifts(id, ct));
}