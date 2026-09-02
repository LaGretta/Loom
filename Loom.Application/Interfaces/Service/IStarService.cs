using Loom.Application.DTO;

namespace Loom.Application.Interfaces.Service;

public interface IStarService
{
    Task<StarBalanceDto> GetBalance(int userId, CancellationToken ct);
    Task<PagedResponse<StarTransactionDto>> GetHistory(int userId, int page, int pageSize, CancellationToken ct);
    Task<StarBalanceDto> PurchaseStars(int userId, PurchaseStarsDto dto, CancellationToken ct);
}