using Loom.Application.Interfaces.Repository;
using Loom.Domain.Entities;
using Loom.Domain.Entities.Stars;
using Loom.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Loom.Infrastructure.Repository;

public class GiftRepository : IGiftRepository
{
    private readonly LoomDbContext _context;
    public GiftRepository(LoomDbContext context) => _context = context;

    public async Task<List<Gift>> GetCatalogAsync(CancellationToken ct) =>
        await _context.Gifts.Where(g => g.IsActive).ToListAsync(ct);

    public async Task<Gift?> GetGiftByIdAsync(int giftId, CancellationToken ct) =>
        await _context.Gifts.FirstOrDefaultAsync(g => g.Id == giftId, ct);
    public async Task AddGiftInstanceAsync(GiftInstance instance, CancellationToken ct) =>
        await _context.GiftInstances.AddAsync(instance, ct);
    public async Task<List<GiftInstance>> GetReceivedGiftsAsync(int userId, CancellationToken ct) =>
        await _context.GiftInstances
            .Include(gi => gi.Gift)
            .Include(gi => gi.Sender)
            .Where(gi => gi.ReceiverId == userId)
            .ToListAsync(ct);
}