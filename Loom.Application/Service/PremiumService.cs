using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Service;
using Loom.Domain.Entities;
using Loom.Domain.Enums;

namespace Loom.Application.Service;

public class PremiumService : IPremiumService
{
    private readonly IUserRepository _userRepo;
    private readonly IStarRepository _starRepo;
    private readonly IUnitOfWork _unitOfWork;
    private static readonly Dictionary<int, int> Plans = new()
    {
        { 1, 300 },
        { 6, 1500 },
        { 12, 2500 }
    };
    public PremiumService(
        IUserRepository userRepo,
        IStarRepository starRepo,
        IUnitOfWork unitOfWork)
    {
        _userRepo = userRepo;
        _starRepo = starRepo;
        _unitOfWork = unitOfWork;
    }
    public List<PremiumPlanDto> GetPlans() =>
        Plans.Select(p => new PremiumPlanDto
        {
            Name = p.Key == 1 ? "1 Month" : $"{p.Key} Months",
            Months = p.Key,
            StarCost = p.Value
        }).ToList();
    public async Task<PremiumStatusDto> GetStatus(int userId, CancellationToken ct)
    {
        var user = await _userRepo.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        return BuildStatus(user);
    }

    public async Task<PremiumStatusDto> Subscribe(int userId, SubscribePremiumDto dto, CancellationToken ct)
    {
        if (!Plans.TryGetValue(dto.Months, out var cost))
            throw new InvalidOperationException("Invalid plan");

        var user = await _userRepo.GetByIdAsync(userId, ct);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        if (user.StarBalance < cost)
            throw new InvalidOperationException("Not enough stars");

        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            user.StarBalance -= cost;
            await _starRepo.AddTransactionAsync(new StarTransaction
            {
                UserId = userId,
                Type = StarTransactionType.PremiumPurchase,
                Amount = -cost,
                BalanceAfter = user.StarBalance,
                CreatedAt = DateTime.UtcNow
            }, ct);

            var from = user.PremiumUntil.HasValue && user.PremiumUntil > DateTime.UtcNow
                ? user.PremiumUntil.Value   
                : DateTime.UtcNow;          
            user.PremiumTier = PremiumTier.Premium;
            user.PremiumUntil = from.AddMonths(dto.Months);

            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            return BuildStatus(user);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }
    private static PremiumStatusDto BuildStatus(User user) => new()
    {
        Tier = user.PremiumTier,
        Until = user.PremiumUntil,
        IsActive = user.PremiumTier == PremiumTier.Premium
                   && user.PremiumUntil.HasValue
                   && user.PremiumUntil > DateTime.UtcNow
    };
}