using AutoMapper;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Security;
using Loom.Application.Interfaces.Service;
using Loom.Domain.Entities;
using Loom.Domain.Enums;

namespace Loom.Application.Service;

public class ChatService : IChatService
{
    private readonly IChatRepository _chatRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ChatService(
        IChatRepository chatRepo
        , IUnitOfWork unitOfWork
        , IMapper mapper)
    {
        _chatRepo = chatRepo;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ChatResponseDto> CreateChat(int userId, CreateChatDto dto, CancellationToken ct)
    {
        var chat = new Chat
        {
            Type = dto.Type,
            Title = dto.Title,
            Description = dto.Description,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow
        };
        await _chatRepo.CreateAsync(chat, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        
        await _chatRepo.AddMemberAsync(new ChatMember
        {
            ChatId = chat.Id,
            UserId = userId,
            Role = MemberRole.Owner,
            JoinedAt = DateTime.UtcNow
        }, ct);
        foreach (var memberId in dto.MemberUserIds.Where(id => id != userId).Distinct())
        {
            await _chatRepo.AddMemberAsync(new ChatMember
            {
                ChatId = chat.Id,
                UserId = memberId,
                Role = MemberRole.Member,
                JoinedAt = DateTime.UtcNow
            }, ct);
        }
        await _unitOfWork.SaveChangesAsync(ct);

        var response = _mapper.Map<ChatResponseDto>(chat);
        response.MembersCount = 1 + dto.MemberUserIds.Count(id => id != userId);
        return response;
    }

    public async Task<List<ChatResponseDto>> GetMyChats(int userId, CancellationToken ct)
    {
        var chats = await _chatRepo.GetMyChatsAsync(userId, ct);
        return chats.Select(c =>
        {
            var dto = _mapper.Map<ChatResponseDto>(c);
            dto.MembersCount = c.Members.Count;
            return dto;
        }).ToList();
    }
    public async Task<ChatResponseDto> GetChatById(int userId, int chatId, CancellationToken ct)
    {
        if (!await _chatRepo.IsMemberAsync(chatId, userId, ct))
            throw new UnauthorizedAccessException("Not a member of this chat");

        var chat = await _chatRepo.GetByIdAsync(chatId, ct);
        if (chat == null)
            throw new KeyNotFoundException("Chat not found");

        var dto = _mapper.Map<ChatResponseDto>(chat);
        dto.MembersCount = chat.Members.Count;
        return dto;
    }
    public async Task JoinChat(int userId, int chatId, CancellationToken ct)
    {
        var chat = await _chatRepo.GetByIdAsync(chatId, ct);
        if (chat == null)
            throw new KeyNotFoundException("Chat not found");

        if (await _chatRepo.IsMemberAsync(chatId, userId, ct))
            return;
        await _chatRepo.AddMemberAsync(new ChatMember
        {
            ChatId = chatId,
            UserId = userId,
            Role = MemberRole.Member,
            JoinedAt = DateTime.UtcNow
        }, ct);
        await _unitOfWork.SaveChangesAsync(ct);
    }
    public async Task LeaveChat(int userId, int chatId, CancellationToken ct)
    {
        var member = await _chatRepo.GetMemberAsync(chatId, userId, ct);
        if (member == null) return;

        _chatRepo.RemoveMember(member);
        await _unitOfWork.SaveChangesAsync(ct);
    }
    public async Task<List<ChatMemberDto>> GetMembers(int userId, int chatId, CancellationToken ct)
    {
        if (!await _chatRepo.IsMemberAsync(chatId, userId, ct))
            throw new UnauthorizedAccessException("Not a member of this chat");

        var members = await _chatRepo.GetMembersAsync(chatId, ct);
        return _mapper.Map<List<ChatMemberDto>>(members);
    }
}