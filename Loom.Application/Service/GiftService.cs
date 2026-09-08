using AutoMapper;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Service;
using Loom.Domain.Entities.Chats;
using Loom.Domain.Entities.Stars;
using Loom.Domain.Enums;

namespace Loom.Application.Service;

public class GiftService : IGiftService
{
    private const string CatalogCacheKey = "gifts:catalog";
    
    private readonly IGiftRepository _giftRepository;
    private readonly IStarRepository _starRepository;
    private readonly IUserRepository _userRepository;
    private readonly IChatRepository _chatRepository;
    private readonly IMessageRepository _messageRepository;
    private readonly IChatNotifier _notifier;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICacheService _cache; 

    public GiftService(
        IGiftRepository giftRepository,
        IStarRepository starRepository,
        IUserRepository userRepository,
        IChatRepository chatRepository,
        IMessageRepository messageRepository,
        IChatNotifier notifier,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cache)
    {
        _giftRepository = giftRepository;
        _starRepository = starRepository;
        _userRepository = userRepository;
        _chatRepository = chatRepository;
        _messageRepository = messageRepository;
        _notifier = notifier;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<List<GiftDto>> GetCatalog(CancellationToken ct)
    {
        var cached = await _cache.GetAsync<List<GiftDto>>(CatalogCacheKey, ct);
        if (cached != null)
            return cached;                       

        var gifts = await _giftRepository.GetCatalogAsync(ct);
        var dtos = _mapper.Map<List<GiftDto>>(gifts);

        // кладемо в кеш на 10 хвилин
        await _cache.SetAsync(CatalogCacheKey, dtos, TimeSpan.FromMinutes(10), ct);
        return dtos;
    }

  public async Task<GiftInstanceDto> SendGift(int userId, SendGiftDto dto, CancellationToken ct)
{
    var gift = await _giftRepository.GetGiftByIdAsync(dto.GiftId, ct);
    if (gift == null || !gift.IsActive)
        throw new KeyNotFoundException("Gift not found");

    var sender = await _userRepository.GetByIdAsync(userId, ct);
    if (sender == null)
        throw new KeyNotFoundException("Sender not found");
    if (sender.StarBalance < gift.StarCost)
        throw new InvalidOperationException("Not enough stars");

    var receiver = await _userRepository.GetByIdAsync(dto.ReceiverId, ct);
    if (receiver == null)
        throw new KeyNotFoundException("Receiver not found");

    await _unitOfWork.BeginTransactionAsync(ct);
    try
    { sender.StarBalance -= gift.StarCost;
        await _starRepository.AddTransactionAsync(new StarTransaction
        {
            UserId = userId,
            Type = StarTransactionType.GiftSent,
            Amount = -gift.StarCost,
            BalanceAfter = sender.StarBalance,
            CreatedAt = DateTime.UtcNow
        }, ct);

        int? messageId = null;

        if (dto.ReceiverId != userId)
        {
            var chat = await _chatRepository.GetDirectChatAsync(userId, dto.ReceiverId, ct);
            if (chat == null)
            {
                chat = new Chat { Type = ChatType.Direct, CreatedById = userId, CreatedAt = DateTime.UtcNow };
                await _chatRepository.CreateAsync(chat, ct);
                await _unitOfWork.SaveChangesAsync(ct);
                await _chatRepository.AddMemberAsync(new ChatMember { ChatId = chat.Id, UserId = userId, Role = MemberRole.Member, JoinedAt = DateTime.UtcNow }, ct);
                await _chatRepository.AddMemberAsync(new ChatMember { ChatId = chat.Id, UserId = dto.ReceiverId, Role = MemberRole.Member, JoinedAt = DateTime.UtcNow }, ct);
                await _unitOfWork.SaveChangesAsync(ct);
            }
            var message = new Message
            {
                ChatId = chat.Id, SenderId = userId, Content = gift.Name,
                Type = MessageType.Gift, Status = MessageStatus.Sent, SentAt = DateTime.UtcNow
            };
            await _messageRepository.CreateAsync(message, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            messageId = message.Id;
        }
        var instance = new GiftInstance
        {
            GiftId = dto.GiftId,
            SenderId = userId,
            ReceiverId = dto.ReceiverId,
            MessageId = messageId,       
            SentAt = DateTime.UtcNow
        };
        await _giftRepository.AddGiftInstanceAsync(instance, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        await _unitOfWork.CommitTransactionAsync(ct);

        if (messageId != null)
        {
            var msgDto = _mapper.Map<MessageResponseDto>(
                await _messageRepository.GetByIdAsync(messageId.Value, ct));
            await _notifier.MessageSent(msgDto.ChatId, msgDto);
        }

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
        var gifts = await _giftRepository.GetReceivedGiftsAsync(userId, ct);
        return _mapper.Map<List<GiftInstanceDto>>(gifts);
    }
    
    public async Task<List<GiftInstanceDto>> GetUserGifts(int userId, CancellationToken ct)
    {
        var gifts = await _giftRepository.GetReceivedGiftsAsync(userId, ct);
        return _mapper.Map<List<GiftInstanceDto>>(gifts);
    }
}
//