using Loom.Domain.Entities.Users;
using Loom.Domain.Enums;

namespace Loom.Domain.Entities.Chats;

public class ChatMember
{
    public int Id { get; set; }

    public int ChatId { get; set; }
    public Chat Chat { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public MemberRole Role { get; set; }      
    public DateTime JoinedAt { get; set; }
    public DateTime? LastReadAt { get; set; } 
    public bool IsMuted { get; set; }          
}