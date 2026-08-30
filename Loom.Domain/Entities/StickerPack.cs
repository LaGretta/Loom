namespace Loom.Domain.Entities;

public class StickerPack
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
    public int? AuthorId { get; set; }          
    public User? Author { get; set; }

    public bool IsPremium { get; set; }      
    public DateTime CreatedAt { get; set; }

    public List<Sticker> Stickers { get; set; } = new();
}