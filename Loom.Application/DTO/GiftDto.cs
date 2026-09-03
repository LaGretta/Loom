using Loom.Domain.Enums;

namespace Loom.Application.DTO;

public class GiftDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int StarCost { get; set; }
    
}

public class SendGiftDto
{
    public int GiftId { get; set; }
    public int ReceiverId { get; set; }
    public int? ChatId { get; set; }       
}
public class GiftInstanceDto
{
    public int Id { get; set; }
    public string GiftName { get; set; } = string.Empty;
    public string GiftImageUrl { get; set; } = string.Empty;
    public int SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public int ReceiverId { get; set; }
    public DateTime SentAt { get; set; }
}