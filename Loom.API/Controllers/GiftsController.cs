using Loom.Application.DTO;
using Loom.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[Authorize]
[Route("api/gifts")]
public class GiftsController : BaseController
{
    private readonly IGiftService _giftService;
    public GiftsController(IGiftService giftService) => _giftService = giftService;
    [HttpGet("catalog")]
    public async Task<IActionResult> Catalog(CancellationToken ct) =>
        Ok(await _giftService.GetCatalog(ct));
    [HttpPost("send")]
    public async Task<IActionResult> Send(SendGiftDto dto, CancellationToken ct) =>
        Ok(await _giftService.SendGift(UserId, dto, ct));
    [HttpGet("my")]
    public async Task<IActionResult> My(CancellationToken ct) =>
        Ok(await _giftService.GetMyGifts(UserId, ct));
}