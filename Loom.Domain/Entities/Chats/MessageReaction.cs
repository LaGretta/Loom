using Loom.Domain.Entities.Users;

namespace Loom.Domain.Entities.Chats;

public class MessageReaction
{
    public int Id { get; set; }

    public int MessageId { get; set; }
    public Message Message { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Emoji { get; set; } = string.Empty;  
    public DateTime CreatedAt { get; set; }
}