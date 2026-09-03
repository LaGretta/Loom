using Loom.Domain.Entities;

namespace Loom.Application.Interfaces.Repository;

public interface IStarRepository
{
    Task AddTransactionAsync(StarTransaction transaction,CancellationToken ct);
    Task<(List<StarTransaction> items, int totalCount)> HistoryAsync(int userid , int page , int pageSize , CancellationToken ct);
}