using AutoMapper;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Security;
using Loom.Application.Interfaces.Service;
using Loom.Domain.Entities.Stars;
using Loom.Domain.Enums;

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
    public async Task<PagedResponse<StarTransactionDto>> GetHistory(int userId, int page, int pageSize, CancellationToken ct)
    {
        var (items, totalCount) = await _starRepository.HistoryAsync(userId, page, pageSize, ct);

        return new PagedResponse<StarTransactionDto>
        {
            Items = _mapper.Map<List<StarTransactionDto>>(items),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<StarBalanceDto> PurchaseStars(int userId, PurchaseStarsDto dto, CancellationToken ct)
    {
        var user = await _userRepository.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            user.StarBalance += dto.Amount;          
            await _starRepository.AddTransactionAsync(new StarTransaction
            {
                UserId = userId,
                Type = StarTransactionType.Purchase,
                Amount = dto.Amount,
                BalanceAfter = user.StarBalance,
                CreatedAt = DateTime.UtcNow
            }, ct);
            await _unitOfWork.SaveChangesAsync(ct);  
            await _unitOfWork.CommitTransactionAsync(ct);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
        return new StarBalanceDto
        {
            Balance = user.StarBalance,
            PremiumTier = user.PremiumTier,
            PremiumUntil = user.PremiumUntil
        };
    }
}