using AutoMapper;
using Loom.Application.DTO;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Security;
using Loom.Application.Interfaces.Service;

namespace Loom.Application.Service;

public class StarService : IStarService
{
    private readonly IStarRepository  _starRepository;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;
    private IUserRepository _userRepository;

    public StarService(
        IStarRepository starRepository
        , IMapper mapper
        , IUnitOfWork unitOfWork
        , IUserRepository userRepository)
    {
        _starRepository = starRepository;
        _mapper = mapper;
        _unitOfWork = unitOfWork;
        _userRepository = userRepository;
    }

    public async Task<StarBalanceDto> GetBalance(int userId, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        return new StarBalanceDto
        {
            Balance = user.StarBalance,
            PremiumTier = user.PremiumTier,
            PremiumUntil = user.PremiumUntil
        };
    }

    public Task<PagedResponse<StarTransactionDto>> GetHistory(int userId, int page, int pageSize, CancellationToken ct)
    {
        throw new NotImplementedException();
    }

    public Task<StarBalanceDto> PurchaseStars(int userId, PurchaseStarsDto dto, CancellationToken ct)
    {
        throw new NotImplementedException();
    }
}