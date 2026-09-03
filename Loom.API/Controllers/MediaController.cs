using Loom.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[Authorize]
[Route("api/media")]
public class MediaController : BaseController
{
    private readonly IMediaStorage _storage;
    public MediaController(IMediaStorage storage) => _storage = storage;

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file");
        
        await using var stream = file.OpenReadStream();
        var url = await _storage.UploadImageAsync(stream, file.FileName, ct);
        return Ok(new { url });
    }
}