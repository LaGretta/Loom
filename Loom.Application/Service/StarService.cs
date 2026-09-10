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
    private readonly IPaymentService _payments;

    public StarService(
        IStarRepository starRepository
        , IMapper mapper
        , IUnitOfWork unitOfWork
        , IUserRepository userRepository
        , IPaymentService payments)
    {
        _starRepository = starRepository;
        _mapper = mapper;
        _unitOfWork = unitOfWork;
        _userRepository = userRepository;
        _payments = payments;
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
        // пакети — джерело правди на сервері, щоб клієнт не міг підсунути свою ціну
    private static readonly List<StarPackDto> Packs = new()
    {
        new() { Id = "s100",  Stars = 100,  PriceCents = 199,  Currency = "usd", DisplayPrice = "$1.99" },
        new() { Id = "s500",  Stars = 500,  PriceCents = 899,  Currency = "usd", DisplayPrice = "$8.99" },
        new() { Id = "s1000", Stars = 1000, PriceCents = 1599, Currency = "usd", DisplayPrice = "$15.99" },
        new() { Id = "s2500", Stars = 2500, PriceCents = 3499, Currency = "usd", DisplayPrice = "$34.99" }
    };

    public List<StarPackDto> GetPacks() => Packs;

    public async Task<CheckoutSessionDto> CreateCheckout(int userId, CreateCheckoutDto dto, CancellationToken ct)
    {
        var pack = Packs.FirstOrDefault(p => p.Id == dto.PackId);
        if (pack == null)
            throw new KeyNotFoundException("Unknown star pack");

        var user = await _userRepository.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        var (sessionId, url) = await _payments.CreateCheckoutSessionAsync(
            userId, pack.Stars, pack.PriceCents, pack.Currency, ct);

        await _starRepository.AddPurchaseAsync(new StarPurchase
        {
            UserId = userId,
            SessionId = sessionId,
            StarAmount = pack.Stars,
            AmountPaid = pack.PriceCents,
            Currency = pack.Currency,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return new CheckoutSessionDto { SessionId = sessionId, Url = url };
    }

    public async Task HandleCheckoutCompleted(string json, string signatureHeader, CancellationToken ct)
    {
        var parsed = _payments.ParseCompletedCheckout(json, signatureHeader);
        if (parsed == null)
            return;   

        var (userId, sessionId, amountPaid, currency) = parsed.Value;

        var purchase = await _starRepository.GetPurchaseBySessionAsync(sessionId, ct);
        if (purchase == null)
            return;                       

        if (purchase.IsCompleted)
            return;                       

        var user = await _userRepository.GetByIdAsync(purchase.UserId, ct);
        if (user == null)
            return;

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            user.StarBalance += purchase.StarAmount;

            await _starRepository.AddTransactionAsync(new StarTransaction
            {
                UserId = purchase.UserId,
                Type = StarTransactionType.Purchase,
                Amount = purchase.StarAmount,
                BalanceAfter = user.StarBalance,
                CreatedAt = DateTime.UtcNow
            }, ct);

            purchase.IsCompleted = true;
            purchase.CompletedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }
}