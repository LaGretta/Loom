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
    public bool IsMuted { get; set; }
    public string? Description { get; set; }
    public MemberRole MyRole { get; set; }
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
    public DateTime LastSeenAt { get; set; }
}
public class UpdateChatDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }
}

public class SetRoleDto
{
    public MemberRole Role { get; set; }
}
public class CreateInviteDto
{
    public int? ExpiresInHours { get; set; }  
    public int? MaxUses { get; set; }          
}

public class InviteDto
{
    public string Code { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUses { get; set; }
    public int Uses { get; set; }
    public bool IsActive { get; set; }
}

public class InvitePreviewDto 
{
    public int ChatId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }
    public int MembersCount { get; set; }
    public bool AlreadyMember { get; set; }
}