using Loom.Application.DTO;

namespace Loom.Application.Interfaces.Service;

public interface IMessageService
{
    Task<MessageResponseDto> SendMessage(int userid , SendMessageDto dto, CancellationToken ct);
    Task<PagedResponse<MessageResponseDto>> GetHistory(int userId, int chatId, int pageNumber, int pageSize, CancellationToken ct);
    Task<MessageResponseDto> EditMessage(int userId, EditMessageDto dto, CancellationToken ct);
    Task DeleteMessage(int userId, int messageId, CancellationToken ct);
    Task MarkAsRead(int userId, int messageId, CancellationToken ct);
    Task ToggleReaction(int userId, ToggleReactionDto dto, CancellationToken ct);
}