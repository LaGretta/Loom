namespace Loom.Application.DTO;

public class StickerPackDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsPremium { get; set; }
    public List<StickerDto> Stickers { get; set; } = new();
}
public class StickerDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? Emoji { get; set; }
}
public class SendStickerDto
{
    public int ChatId { get; set; }
    public int StickerId { get; set; }
}