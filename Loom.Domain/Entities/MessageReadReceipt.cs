namespace Loom.Domain.Entities;

public class MessageReadReceipt
{
    public int Id { get; set; }

    public int MessageId { get; set; }
    public Message Message { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime ReadAt { get; set; }
}