using Loom.Domain.Enums;

namespace Loom.Application.DTO;

public class CreateChatDto
{
    public ChatType Type { get; set; }               
    public string? Title { get; set; }              
    public string? Description { get; set; }
    public List<int> MemberUserIds { get; set; } = new();
}
public class ChatResponseDto
{
    public int Id { get; set; }
    public ChatType Type { get; set; }
    public string? Title { get; set; }                
    public string? AvatarUrl { get; set; }
    public int MembersCount { get; set; }
    public MessagePreviewDto? LastMessage { get; set; } 
    public int UnreadCount { get; set; }              
}
public class MessagePreviewDto
{
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public MessageType Type { get; set; }
    public DateTime SentAt { get; set; }
}
public class ChatMemberDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public MemberRole Role { get; set; }
    public UserStatus Status { get; set; }
}