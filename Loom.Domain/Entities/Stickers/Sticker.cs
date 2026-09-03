namespace Loom.Domain.Entities.Stickers;

public class Sticker
{
    public int Id { get; set; }

    public int StickerPackId { get; set; }
    public StickerPack StickerPack { get; set; } = null!;
    public string ImageUrl { get; set; } = string.Empty;   
    public string? Emoji { get; set; }                   
}