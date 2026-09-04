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
    private readonly IGiftRepository _giftRepository;
    private readonly IStarRepository _starRepository;
    private readonly IUserRepository _userRepository;
    private readonly IChatRepository _chatRepository;
    private readonly IMessageRepository _messageRepository;
    private readonly IChatNotifier _notifier;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GiftService(
        IGiftRepository giftRepository,
        IStarRepository starRepository,
        IUserRepository userRepository,
        IChatRepository chatRepository,
        IMessageRepository messageRepository,
        IChatNotifier notifier,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _giftRepository = giftRepository;
        _starRepository = starRepository;
        _userRepository = userRepository;
        _chatRepository = chatRepository;
        _messageRepository = messageRepository;
        _notifier = notifier;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<GiftDto>> GetCatalog(CancellationToken ct)
    {
        var gifts = await _giftRepository.GetCatalogAsync(ct);
        return _mapper.Map<List<GiftDto>>(gifts);
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
            var chat = await _chatRepository.GetDirectChatAsync(userId, dto.ReceiverId, ct);
            if (chat == null)
            {
                chat = new Chat
                {
                    Type = ChatType.Direct,
                    CreatedById = userId,
                    CreatedAt = DateTime.UtcNow
                };
                await _chatRepository.CreateAsync(chat, ct);
                await _unitOfWork.SaveChangesAsync(ct);

                await _chatRepository.AddMemberAsync(new ChatMember
                {
                    ChatId = chat.Id, UserId = userId, Role = MemberRole.Member, JoinedAt = DateTime.UtcNow
                }, ct);
                await _chatRepository.AddMemberAsync(new ChatMember
                {
                    ChatId = chat.Id, UserId = dto.ReceiverId, Role = MemberRole.Member, JoinedAt = DateTime.UtcNow
                }, ct);
                await _unitOfWork.SaveChangesAsync(ct);
            }
            var message = new Message
            {
                ChatId = chat.Id,
                SenderId = userId,
                Content = gift.Name,          
                Type = MessageType.Gift,
                Status = MessageStatus.Sent,
                SentAt = DateTime.UtcNow
            };
            await _messageRepository.CreateAsync(message, ct);
            await _unitOfWork.SaveChangesAsync(ct);   

            var instance = new GiftInstance
            {
                GiftId = dto.GiftId,
                SenderId = userId,
                ReceiverId = dto.ReceiverId,
                MessageId = message.Id,
                SentAt = DateTime.UtcNow
            };
            await _giftRepository.AddGiftInstanceAsync(instance, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            await _unitOfWork.CommitTransactionAsync(ct);
            var msgDto = _mapper.Map<MessageResponseDto>(message);
            await _notifier.MessageSent(chat.Id, msgDto);

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