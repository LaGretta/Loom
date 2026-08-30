using Loom.Domain.Enums;

namespace Loom.Domain.Entities;

public class StarTransaction
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public StarTransactionType Type { get; set; }   
    public int Amount { get; set; }                 
    public int BalanceAfter { get; set; }         
    public int? RelatedGiftInstanceId { get; set; }
    public DateTime CreatedAt { get; set; }
}