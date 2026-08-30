using Loom.Domain.Enums;

namespace Loom.Application.DTO;

public class SendMessageDto
{
    public int ChatId { get; set; }
    public string Content { get; set; } = string.Empty;
    public MessageType Type { get; set; } = MessageType.Text;
    public int? ReplyToMessageId { get; set; }
}

public class EditMessageDto
{
    public int MessageId { get; set; }
    public string Content { get; set; } = string.Empty;
}
public class MessageResponseDto
{
    public int Id { get; set; }
    public int ChatId { get; set; }
    public int SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;      
    public string? SenderAvatarUrl { get; set; }
    public string Content { get; set; } = string.Empty;
    public MessageType Type { get; set; }
    public MessageStatus Status { get; set; }
    public int? ReplyToMessageId { get; set; }
    public string? ReplyToPreview { get; set; }                 
    public bool IsEdited { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime SentAt { get; set; }
    public List<AttachmentDto> Attachments { get; set; } = new();
    public List<ReactionSummaryDto> Reactions { get; set; } = new();
}

public class AttachmentDto
{
    public int Id { get; set; }
    public AttachmentType Type { get; set; }
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}
public class ReactionSummaryDto
{
    public string Emoji { get; set; } = string.Empty;
    public int Count { get; set; }
    public bool ReactedByMe { get; set; }
}