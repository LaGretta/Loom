namespace Loom.Domain.Entities.Chats;

public class ChatInvite
{
    public int Id { get; set; }

    public int ChatId { get; set; }
    public Chat Chat { get; set; } = null!;

    public string Code { get; set; } = string.Empty;   

    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }           
    public int? MaxUses { get; set; }                 
    public int Uses { get; set; }
    public bool IsRevoked { get; set; }

    public bool IsActive =>
        !IsRevoked
        && (ExpiresAt == null || ExpiresAt > DateTime.UtcNow)
        && (MaxUses == null || Uses < MaxUses);
}