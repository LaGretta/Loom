using Loom.Application.DTO;

namespace Loom.Application.Interfaces;

public interface IChatNotifier
{
    Task MessageSent(int chatId, MessageResponseDto message);
    Task MessageEdited(int chatId, MessageResponseDto message);
    Task MessageDeleted(int chatId, int messageId);
    Task ReactionUpdated(int chatId, int messageId);
    Task MessageRead(int chatId, int messageId, int userId);
    Task EventShared(int chatId, EventResponseDto ev);
    Task EventUpdated(int chatId, EventResponseDto ev);
}