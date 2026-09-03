using Loom.Domain.Enums;

namespace Loom.Application.DTO;

public class UserProfileDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public UserStatus Status { get; set; }
    public DateTime LastSeenAt { get; set; }
    public PremiumTier PremiumTier { get; set; } 
}
public class UserSummaryDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public UserStatus Status { get; set; }
    public PremiumTier PremiumTier { get; set; }
}
public class UpdateProfileDto
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
}
