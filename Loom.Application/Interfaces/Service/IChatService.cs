using Loom.Application.DTO;

namespace Loom.Application.Interfaces.Service;

public interface IChatService
{
    Task<ChatResponseDto> CreateChat(int userId, CreateChatDto dto, CancellationToken ct);
    Task<List<ChatResponseDto>> GetMyChats(int userId, CancellationToken ct);
    Task<ChatResponseDto> GetChatById(int userId, int chatId, CancellationToken ct);
    Task JoinChat(int userId, int chatId, CancellationToken ct);
    Task LeaveChat(int userId, int chatId, CancellationToken ct);
    Task<List<ChatMemberDto>> GetMembers(int userId, int chatId, CancellationToken ct);
}