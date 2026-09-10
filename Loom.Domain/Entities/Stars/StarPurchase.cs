namespace Loom.Domain.Entities.Stars;

public class StarPurchase
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public string SessionId { get; set; } = string.Empty;  
    public int StarAmount { get; set; }
    public long AmountPaid { get; set; }                   
    public string Currency { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}