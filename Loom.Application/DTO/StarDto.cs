using Loom.Domain.Enums;

namespace Loom.Application.DTO;

public class StarBalanceDto
{
    public int Balance { get; set; }
    public PremiumTier PremiumTier { get; set; }
    public DateTime? PremiumUntil { get; set; }
}

public class StarTransactionDto
{
    public int Id { get; set; }
    public StarTransactionType Type { get; set; }
    public int Amount { get; set; }          
    public int BalanceAfter { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PurchaseStarsDto
{
    public int Amount { get; set; }        
}