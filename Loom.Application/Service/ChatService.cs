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

public class ChatService : IChatService
{
    private readonly IChatRepository _chatRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IMessageRepository _messageRepo;

    public ChatService(
        IChatRepository chatRepo
        , IUnitOfWork unitOfWork
        , IMapper mapper
        , IMessageRepository messageRepo)
    {
        _chatRepo = chatRepo;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _messageRepo = messageRepo;
    }

    public async Task<ChatResponseDto> CreateChat(int userId, CreateChatDto dto, CancellationToken ct)
    {
        if (dto.Type == ChatType.Direct)
        {
            var otherId = dto.MemberUserIds.FirstOrDefault(id => id != userId);
            if (otherId != 0)
            {
                var existing = await _chatRepo.GetDirectChatAsync(userId, otherId, ct);
                if (existing != null)
                {
                    var existingDto = _mapper.Map<ChatResponseDto>(existing);
                    existingDto.MembersCount = existing.Members.Count;
                    return existingDto;   
                }
            }
        }
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
            ChatId = chat.Id, UserId = userId, Role = MemberRole.Owner, JoinedAt = DateTime.UtcNow
        }, ct);
        foreach (var memberId in dto.MemberUserIds.Where(id => id != userId).Distinct())
        {
            await _chatRepo.AddMemberAsync(new ChatMember
            {
                ChatId = chat.Id, UserId = memberId, Role = MemberRole.Member, JoinedAt = DateTime.UtcNow
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
        var result = new List<ChatResponseDto>();

        foreach (var c in chats)
        {
            var dto = _mapper.Map<ChatResponseDto>(c);
            dto.MembersCount = c.Members.Count;

            var last = await _messageRepo.GetLastMessageAsync(c.Id, ct);
            if (last != null)
            {
                dto.LastMessage = new MessagePreviewDto
                {
                    SenderName = last.Sender.DisplayName,
                    Content = last.Content,
                    Type = last.Type,
                    SentAt = last.SentAt
                };
            }
            var myMembership = c.Members.FirstOrDefault(m => m.UserId == userId);
            dto.IsMuted = myMembership?.IsMuted ?? false;
            dto.MyRole = myMembership?.Role ?? MemberRole.Member;

            dto.UnreadCount = myMembership?.IsMuted == true
                ? 0
                : await _messageRepo.CountUnreadAsync(c.Id, userId, myMembership?.LastReadAt, ct);

            if (c.Type == ChatType.Direct)
            {
                var other = c.Members.FirstOrDefault(m => m.UserId != userId);
                if (other?.User != null)
                {
                    dto.Title = other.User.DisplayName;
                    dto.AvatarUrl = other.User.AvatarUrl;
                }
            }
            result.Add(dto);
        }
        return result;
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
        
        var myMembership = chat.Members.FirstOrDefault(m => m.UserId == userId);
        dto.MyRole = myMembership?.Role ?? MemberRole.Member;
        dto.IsMuted = myMembership?.IsMuted ?? false;
        
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
    
    public async Task MarkChatRead(int userId, int chatId, CancellationToken ct)
    {
        var member = await _chatRepo.GetMemberAsync(chatId, userId, ct);
        if (member == null) return;

        member.LastReadAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(ct);
    }
    
    public async Task<bool> ToggleMute(int userId, int chatId, CancellationToken ct)
    {
        var member = await _chatRepo.GetMemberAsync(chatId, userId, ct);
        if (member == null)
            throw new UnauthorizedAccessException("Not a member of this chat");

        member.IsMuted = !member.IsMuted;
        await _unitOfWork.SaveChangesAsync(ct);

        return member.IsMuted;
    }


    private async Task<MemberRole> RequireMember(int chatId, int userId, CancellationToken ct)
    {
        var member = await _chatRepo.GetMemberAsync(chatId, userId, ct);
        if (member == null)
            throw new UnauthorizedAccessException("Not a member of this chat");
        return member.Role;
    }
    private async Task RequireAdmin(int chatId, int userId, CancellationToken ct)
    {
        var role = await RequireMember(chatId, userId, ct);
        if (role == MemberRole.Member)
            throw new UnauthorizedAccessException("Admin rights required");
    }
    private async Task RequireOwner(int chatId, int userId, CancellationToken ct)
    {
        var role = await RequireMember(chatId, userId, ct);
        if (role != MemberRole.Owner)
            throw new UnauthorizedAccessException("Owner rights required");
    }
    
    
    
        public async Task UpdateChat(int userId, int chatId, UpdateChatDto dto, CancellationToken ct)
    {
        await RequireAdmin(chatId, userId, ct);

        var chat = await _chatRepo.GetByIdAsync(chatId, ct);
        if (chat == null)
            throw new KeyNotFoundException("Chat not found");
        if (chat.Type == ChatType.Direct)
            throw new InvalidOperationException("Direct chats cannot be edited");

        if (dto.Title != null) chat.Title = dto.Title;
        if (dto.Description != null) chat.Description = dto.Description;
        if (dto.AvatarUrl != null) chat.AvatarUrl = dto.AvatarUrl;

        await _unitOfWork.SaveChangesAsync(ct);
    }

    public async Task RemoveMember(int userId, int chatId, int targetUserId, CancellationToken ct)
    {
        var myRole = await RequireMember(chatId, userId, ct);
        if (myRole == MemberRole.Member)
            throw new UnauthorizedAccessException("Admin rights required");

        if (targetUserId == userId)
            throw new InvalidOperationException("Use leave instead");

        var target = await _chatRepo.GetMemberAsync(chatId, targetUserId, ct);
        if (target == null)
            throw new KeyNotFoundException("Member not found");

        if (target.Role == MemberRole.Owner)
            throw new UnauthorizedAccessException("Cannot remove the owner");
        if (target.Role == MemberRole.Admin && myRole != MemberRole.Owner)
            throw new UnauthorizedAccessException("Only the owner can remove an admin");

        _chatRepo.RemoveMember(target);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    public async Task SetMemberRole(int userId, int chatId, int targetUserId, MemberRole role, CancellationToken ct)
    {
        await RequireOwner(chatId, userId, ct);

        if (targetUserId == userId)
            throw new InvalidOperationException("Cannot change your own role");

        var target = await _chatRepo.GetMemberAsync(chatId, targetUserId, ct);
        if (target == null)
            throw new KeyNotFoundException("Member not found");

        if (role == MemberRole.Owner)
            throw new InvalidOperationException("Ownership transfer is not supported yet");

        target.Role = role;
        await _unitOfWork.SaveChangesAsync(ct);
    }

    public async Task DeleteChat(int userId, int chatId, CancellationToken ct)
    {
        await RequireOwner(chatId, userId, ct);

        var chat = await _chatRepo.GetByIdAsync(chatId, ct);
        if (chat == null)
            throw new KeyNotFoundException("Chat not found");

        _chatRepo.Remove(chat);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}