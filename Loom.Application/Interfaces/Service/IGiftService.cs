using Loom.Application.DTO;

namespace Loom.Application.Interfaces.Service;

public interface IGiftService
{
    Task<List<GiftDto>> GetCatalog(CancellationToken ct);
    Task<GiftInstanceDto> SendGift(int userId, SendGiftDto dto, CancellationToken ct);
    Task<List<GiftInstanceDto>> GetMyGifts(int userId, CancellationToken ct);
    Task<List<GiftInstanceDto>> GetUserGifts(int userId, CancellationToken ct);
}