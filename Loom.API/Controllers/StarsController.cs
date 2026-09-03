using Loom.Application.DTO;
using Loom.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[Authorize]
[Route("api/stars")]
public class StarsController : BaseController
{
    private readonly IStarService _starService;
    public StarsController(IStarService starService) => _starService = starService;
    [HttpGet("balance")]
    public async Task<IActionResult> Balance(CancellationToken ct) =>
        Ok(await _starService.GetBalance(UserId, ct));
    [HttpGet("history")]
    public async Task<IActionResult> History([FromQuery] int page = 1, [FromQuery] int pageSize = 30, CancellationToken ct = default) =>
        Ok(await _starService.GetHistory(UserId, page, pageSize, ct));
    [HttpPost("purchase")]
    public async Task<IActionResult> Purchase(PurchaseStarsDto dto, CancellationToken ct) =>
        Ok(await _starService.PurchaseStars(UserId, dto, ct));
}