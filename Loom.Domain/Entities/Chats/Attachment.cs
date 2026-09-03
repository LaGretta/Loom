using Loom.Domain.Enums;

namespace Loom.Domain.Entities.Chats;

public class Attachment
{
    public int Id { get; set; }
    public int MessageId { get; set; }
    public Message Message { get; set; } = null!;
    public AttachmentType Type { get; set; }        
    public string Url { get; set; } = string.Empty; 
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}