using Loom.Domain.Entities.Users;
using Loom.Domain.Enums;

namespace Loom.Domain.Entities.Chats;

public class Message
{
    public int Id { get; set; }

    public int ChatId { get; set; }
    public Chat Chat { get; set; } = null!;

    public int SenderId { get; set; }
    public User Sender { get; set; } = null!;

    public string Content { get; set; } = string.Empty;
    public MessageType Type { get; set; }       
    public MessageStatus Status { get; set; }     

    public int? ReplyToMessageId { get; set; }   
    public Message? ReplyToMessage { get; set; }

    public bool IsEdited { get; set; }
    public DateTime? EditedAt { get; set; }
    public bool IsDeleted { get; set; }          
    public DateTime SentAt { get; set; }
    public List<Attachment> Attachments { get; set; } = new();
    public List<MessageReaction> Reactions { get; set; } = new();
    public List<MessageReadReceipt> ReadReceipts { get; set; } = new();
}