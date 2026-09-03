using Loom.Application.DTO;

namespace Loom.Application.Interfaces;

public interface IChatNotifier
{
    Task MessageSent(int chatId, MessageResponseDto message);
}