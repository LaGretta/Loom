using Loom.Domain.Entities;

namespace Loom.Application.Interfaces.Repository;

public interface IGiftRepository
{
    Task<List<Gift>> GetCatalogAsync(CancellationToken ct);
    Task<Gift?> GetGiftByIdAsync(int giftId, CancellationToken ct);
    Task AddGiftInstanceAsync(GiftInstance instance, CancellationToken ct);
    Task<List<GiftInstance>> GetReceivedGiftsAsync(int userId, CancellationToken ct);
}