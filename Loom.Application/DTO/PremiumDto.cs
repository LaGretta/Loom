using Loom.Domain.Enums;

namespace Loom.Application.DTO;

public class PremiumPlanDto
{
    public string Name { get; set; } = string.Empty;
    public int Months { get; set; }
    public int StarCost { get; set; }
}

public class PremiumStatusDto
{
    public PremiumTier Tier { get; set; }
    public DateTime? Until { get; set; }
    public bool IsActive { get; set; }
}

public class SubscribePremiumDto
{
    public int Months { get; set; }  
}