using Loom.Domain.Entities.Chats;
using Loom.Domain.Enums;

namespace Loom.Domain.Entities.Users;

public class User
{
    public int Id { get; set; }

    public string UserName { get; set; } = string.Empty;    
    public string DisplayName { get; set; } = string.Empty; 
    public string Email { get; set; } = string.Empty;       
    public string PasswordHash { get; set; } = string.Empty;

    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public UserStatus Status { get; set; }
    public DateTime LastSeenAt { get; set; }

    public PremiumTier PremiumTier { get; set; }
    public DateTime? PremiumUntil { get; set; }   
    public int StarBalance { get; set; }       

    public DateTime CreatedAt { get; set; }
    public List<ChatMember> Memberships { get; set; } = new();
    public List<Message> Messages { get; set; } = new();
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}