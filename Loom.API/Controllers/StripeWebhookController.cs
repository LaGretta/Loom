using Loom.Application.Interfaces.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/webhooks/stripe")]
public class StripeWebhookController : ControllerBase
{
    private readonly IStarService _starService;
    private readonly ILogger<StripeWebhookController> _logger;

    public StripeWebhookController(IStarService starService, ILogger<StripeWebhookController> logger)
    {
        _starService = starService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Handle(CancellationToken ct)
    {
        using var reader = new StreamReader(HttpContext.Request.Body);
        var json = await reader.ReadToEndAsync(ct);

        var signature = Request.Headers["Stripe-Signature"].ToString();
        try
        {
            await _starService.HandleCheckoutCompleted(json, signature, ct);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stripe webhook processing failed");
            return BadRequest();
        }
    }
}