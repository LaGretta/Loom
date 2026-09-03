using AutoMapper;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Security;
using Loom.Application.Interfaces.Service;
using Loom.Domain.Entities;
using Loom.Domain.Entities.Chats;
using Loom.Domain.Enums;

namespace Loom.Application.Service;

public class MessageService : IMessageService
{
    private readonly IMessageRepository _messageRepo;
    private readonly IChatRepository _chatRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IChatNotifier _notifier;

    public MessageService(
        IMessageRepository messageRepo,
        IChatRepository chatRepo,
        IUnitOfWork unitOfWork,
        IMapper mapper
        , IChatNotifier notifier)
    {
        _messageRepo = messageRepo;
        _chatRepo = chatRepo;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _notifier = notifier;
    }

    public async Task<MessageResponseDto> SendMessage(int userId, SendMessageDto dto, CancellationToken ct)
    {
        if (!await _chatRepo.IsMemberAsync(dto.ChatId, userId, ct))
            throw new UnauthorizedAccessException("Not a member of this chat");
        var message = new Message
        {
            ChatId = dto.ChatId,
            SenderId = userId,
            Content = dto.Content,
            Type = dto.Type,
            Status = MessageStatus.Sent,
            ReplyToMessageId = dto.ReplyToMessageId,
            SentAt = DateTime.UtcNow
        };

        await _messageRepo.CreateAsync(message, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        

        
        var dtos = _mapper.Map<MessageResponseDto>(message);
        await _notifier.MessageSent(dto.ChatId, dtos); 
        return dtos;
    }

    public async Task<PagedResponse<MessageResponseDto>> GetHistory(
        int userId, int chatId, int page, int pageSize, CancellationToken ct)
    {
        if (!await _chatRepo.IsMemberAsync(chatId, userId, ct))
            throw new UnauthorizedAccessException("Not a member of this chat");

        var (items, totalCount) = await _messageRepo.HistoryAsync(chatId, page, pageSize, ct);

        return new PagedResponse<MessageResponseDto>
        {
            Items = _mapper.Map<List<MessageResponseDto>>(items),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
    public async Task<MessageResponseDto> EditMessage(int userId, EditMessageDto dto, CancellationToken ct)
    {
        var message = await _messageRepo.GetByIdAsync(dto.MessageId, ct);
        if (message == null)
            throw new KeyNotFoundException("Message not found");
        if (message.SenderId != userId)
            throw new UnauthorizedAccessException("Can only edit your own messages");

        message.Content = dto.Content;
        message.IsEdited = true;
        message.EditedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(ct);

        var response = _mapper.Map<MessageResponseDto>(message);
        await _notifier.MessageEdited(message.ChatId, response);
        return response;
    }
    public async Task DeleteMessage(int userId, int messageId, CancellationToken ct)
    {
        var message = await _messageRepo.GetByIdAsync(messageId, ct);
        if (message == null)
            throw new KeyNotFoundException("Message not found");
        if (message.SenderId != userId)
            throw new UnauthorizedAccessException("Can only delete your own messages");
        
        message.IsDeleted = true;
        await _unitOfWork.SaveChangesAsync(ct);
        await _notifier.MessageDeleted(message.ChatId, messageId);
    }
    public async Task MarkAsRead(int userId, int messageId, CancellationToken ct)
    {
        if (await _messageRepo.HasReadReceiptAsync(messageId, userId, ct))
            return;

        var message = await _messageRepo.GetByIdAsync(messageId, ct);
        if (message == null) return;

        await _messageRepo.AddReadReceiptAsync(new MessageReadReceipt
        {
            MessageId = messageId,
            UserId = userId,
            ReadAt = DateTime.UtcNow
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        await _notifier.MessageRead(message.ChatId, messageId, userId);
    }
    
    public async Task ToggleReaction(int userId, ToggleReactionDto dto, CancellationToken ct)
    {
        var existing = await _messageRepo.GetReactionAsync(dto.MessageId, userId, dto.Emoji, ct);

        if (existing != null)
            _messageRepo.RemoveReaction(existing);
        else
            await _messageRepo.AddReactionAsync(new MessageReaction
            {
                MessageId = dto.MessageId,
                UserId = userId,
                Emoji = dto.Emoji,
                CreatedAt = DateTime.UtcNow
            }, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var message = await _messageRepo.GetByIdAsync(dto.MessageId, ct);
        if (message != null)
            await _notifier.ReactionUpdated(message.ChatId, dto.MessageId);
    }
}