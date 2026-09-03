using Loom.Application.DTO;
using Loom.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[Authorize]
[Route("api/premium")]
public class PremiumController : BaseController
{
    private readonly IPremiumService _premiumService;
    public PremiumController(IPremiumService premiumService) => _premiumService = premiumService;

    [HttpGet("plans")]
    public IActionResult Plans() => Ok(_premiumService.GetPlans());
    
    [HttpGet("status")]
    public async Task<IActionResult> Status(CancellationToken ct) =>
        Ok(await _premiumService.GetStatus(UserId, ct));
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe(SubscribePremiumDto dto, CancellationToken ct) =>
        Ok(await _premiumService.Subscribe(UserId, dto, ct));
}