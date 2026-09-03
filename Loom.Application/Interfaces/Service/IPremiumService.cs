using Loom.Application.DTO;

namespace Loom.Application.Interfaces.Service;

public interface IPremiumService
{
    List<PremiumPlanDto> GetPlans();
    Task<PremiumStatusDto> GetStatus(int userId, CancellationToken ct);
    Task<PremiumStatusDto> Subscribe(int userId, SubscribePremiumDto dto, CancellationToken ct);
}