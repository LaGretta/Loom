namespace Loom.Domain.Entities;

public class Gift
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;     
    public string ImageUrl { get; set; } = string.Empty;
    public int StarCost { get; set; }                     
    public bool IsActive { get; set; }               
}