using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Security;
using Microsoft.EntityFrameworkCore.Storage;

namespace Loom.Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly LoomDbContext _context;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(LoomDbContext context) => _context = context;

    public async Task<int> SaveChangesAsync(CancellationToken ct) =>
        await _context.SaveChangesAsync(ct);
    public async Task BeginTransactionAsync(CancellationToken ct) =>
        _transaction = await _context.Database.BeginTransactionAsync(ct);
    public async Task CommitTransactionAsync(CancellationToken ct)
    {
        if (_transaction != null) await _transaction.CommitAsync(ct);
    }
    public async Task RollbackTransactionAsync(CancellationToken ct)
    {
        if (_transaction != null) await _transaction.RollbackAsync(ct);
    }
}