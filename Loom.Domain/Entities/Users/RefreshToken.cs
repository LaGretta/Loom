namespace Loom.Domain.Entities.Users;

public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsRevoked { get; set; }

    public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAt;
}