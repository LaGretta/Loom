using Loom.Domain.Enums;

namespace Loom.Domain.Entities.Chats;

public class Chat
{
    public int Id { get; set; }

    public ChatType Type { get; set; }           

    public string? Title { get; set; }           
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }

    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ChatMember> Members { get; set; } = new();
    public List<Message> Messages { get; set; } = new();
}