using Loom.Domain.Entities;

namespace Loom.Application.Interfaces.Repository;

public interface IStarRepository
{
    Task AddTransactionAsync(StarTransaction transaction,CancellationToken ct);
    Task<(List<StarTransaction> Items, int TotalCount)> HistoryAsync(int userid , int page , int pageSize , CancellationToken ct);
}