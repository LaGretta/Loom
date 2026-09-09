using Loom.Application.DTO;
using Loom.Domain.Enums;

namespace Loom.Application.Interfaces.Service;

public interface IChatService
{
    Task<ChatResponseDto> CreateChat(int userId, CreateChatDto dto, CancellationToken ct);
    Task<List<ChatResponseDto>> GetMyChats(int userId, CancellationToken ct);
    Task<ChatResponseDto> GetChatById(int userId, int chatId, CancellationToken ct);
    Task JoinChat(int userId, int chatId, CancellationToken ct);
    Task LeaveChat(int userId, int chatId, CancellationToken ct);
    Task<List<ChatMemberDto>> GetMembers(int userId, int chatId, CancellationToken ct);
    Task MarkChatRead(int userId, int chatId, CancellationToken ct);
    Task<bool> ToggleMute(int userId, int chatId, CancellationToken ct);
    
    Task UpdateChat(int userId, int chatId, UpdateChatDto dto, CancellationToken ct);
    Task RemoveMember(int userId, int chatId, int targetUserId, CancellationToken ct);
    Task SetMemberRole(int userId, int chatId, int targetUserId, MemberRole role, CancellationToken ct);
    Task DeleteChat(int userId, int chatId, CancellationToken ct);
    
    Task<InviteDto> CreateInvite(int userId, int chatId, CreateInviteDto dto, CancellationToken ct);
    Task<List<InviteDto>> GetInvites(int userId, int chatId, CancellationToken ct);
    Task RevokeInvite(int userId, string code, CancellationToken ct);
    Task<InvitePreviewDto> PreviewInvite(int userId, string code, CancellationToken ct);
    Task<ChatResponseDto> JoinByInvite(int userId, string code, CancellationToken ct);
}