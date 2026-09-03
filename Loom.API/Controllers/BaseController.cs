using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Loom.API.Controllers;

[ApiController]
public abstract class BaseController : ControllerBase
{
    protected int UserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}