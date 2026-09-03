using Loom.Application.Interfaces.Repository;
using Loom.Domain.Entities;
using Loom.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Loom.Infrastructure.Repository;

public class StarRepository : IStarRepository
{
    private readonly LoomDbContext _context;
    public StarRepository(LoomDbContext context) => _context = context;

    public async Task AddTransactionAsync(StarTransaction transaction, CancellationToken ct) =>
        await _context.StarTransactions.AddAsync(transaction, ct);

    public async Task<(List<StarTransaction> items, int totalCount)> HistoryAsync(
        int userId, int page, int pageSize, CancellationToken ct)
    {
        var query = _context.StarTransactions.Where(t => t.UserId == userId);
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        return (items, totalCount);
    }
}