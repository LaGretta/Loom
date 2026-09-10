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
public class StarPackDto
{
    public string Id { get; set; } = string.Empty;
    public int Stars { get; set; }
    public long PriceCents { get; set; }
    public string Currency { get; set; } = "usd";
    public string DisplayPrice { get; set; } = string.Empty;
}

public class CreateCheckoutDto
{
    public string PackId { get; set; } = string.Empty;
}

public class CheckoutSessionDto
{
    public string SessionId { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}