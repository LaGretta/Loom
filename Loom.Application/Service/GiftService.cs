using AutoMapper;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Security;
using Loom.Application.Interfaces.Service;
using Loom.Domain.Entities;
using Loom.Domain.Enums;

namespace Loom.Application.Service;

public class GiftService : IGiftService
{
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IGiftRepository _giftRepository;
    private readonly IStarRepository _starRepository;
    private readonly IUserRepository _userRepository;


    public GiftService(
        IMapper mapper
        , IUnitOfWork unitOfWork
        , IGiftRepository giftRepository
        , IStarRepository starRepository
        , IUserRepository userRepository)
    {
        _mapper = mapper;
        _unitOfWork = unitOfWork;
        _giftRepository = giftRepository;
        _starRepository = starRepository;
        _userRepository = userRepository;
    }

    public async Task<List<GiftDto>> GetCatalog(CancellationToken ct)
    {
        var gifts =  await _giftRepository.GetCatalogAsync(ct);
        return _mapper.Map<List<GiftDto>>(gifts);
    }
    public async Task<GiftInstanceDto> SendGift(int userId, SendGiftDto dto, CancellationToken ct)
    {
        var gift  = await _giftRepository.GetGiftByIdAsync(dto.GiftId, ct);
        if(gift ==  null || !gift.IsActive)
            throw new KeyNotFoundException("Gift not found");
        
        var sender = await _userRepository.GetByIdAsync(userId, ct);
        if(sender == null)
            throw new KeyNotFoundException("Sender not found");
        if(sender.StarBalance > gift.StarCost)
            throw new InvalidOperationException("Not enough stars");
        
        var receiver = await _userRepository.GetByIdAsync(userId, ct);
        if(receiver == null)
            throw new KeyNotFoundException("Receiver not found");
        
        await _unitOfWork.BeginTransactionAsync(ct);
        try
        {
            sender.StarBalance -= gift.StarCost;
            await _starRepository.AddTransactionAsync(new StarTransaction
            {
                UserId = userId,
                Type = StarTransactionType.GiftSent,
                Amount = -gift.StarCost,
                BalanceAfter = sender.StarBalance,
                CreatedAt = DateTime.UtcNow
            }, ct);
            var instance = new GiftInstance
            {
                GiftId = dto.GiftId,
                SenderId = userId,
                ReceiverId = dto.ReceiverId,
                MessageId = null,
                SentAt = DateTime.UtcNow
            };
            await _giftRepository.AddGiftInstanceAsync(instance, ct);

            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);

            return _mapper.Map<GiftInstanceDto>(instance);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(ct);
            throw;
        }
    }
    public async Task<List<GiftInstanceDto>> GetMyGifts(int userId, CancellationToken ct)
    {
        var gifts = await _giftRepository.GetReceivedGiftsAsync(userId,ct);
        return _mapper.Map<List<GiftInstanceDto>>(gifts);
    }
}