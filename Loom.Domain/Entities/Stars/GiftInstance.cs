using Loom.Domain.Entities.Chats;
using Loom.Domain.Entities.Users;

namespace Loom.Domain.Entities.Stars;

public class GiftInstance
{
    public int Id { get; set; }

    public int GiftId { get; set; }
    public Gift Gift { get; set; } = null!;

    public int SenderId { get; set; }
    public User Sender { get; set; } = null!;

    public int ReceiverId { get; set; }
    public User Receiver { get; set; } = null!;
    public int? MessageId { get; set; }       
    public Message? Message { get; set; }
    public DateTime SentAt { get; set; }
}