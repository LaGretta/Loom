using Loom.Domain.Entities;
using Loom.Domain.Entities.Stars;
using Microsoft.EntityFrameworkCore;

namespace Loom.Infrastructure.Data;

public static class GiftSeeder
{
    public static async Task SeedAsync(LoomDbContext context)
    {
        if (await context.Gifts.AnyAsync())
            return;

        var gifts = new List<Gift>
        {
            new() { Name = "Thread Spool",       StarCost = 250,  IsActive = true },
            new() { Name = "Nebula Orb",         StarCost = 900,  IsActive = true },
            new() { Name = "Phoenix Feather",    StarCost = 500,  IsActive = true },
            new() { Name = "Origami Crane",      StarCost = 450,  IsActive = true },
            new() { Name = "Clockwork Heart",    StarCost = 300,  IsActive = true },
            new() { Name = "Aurora Jellyfish",   StarCost = 400,  IsActive = true },
            new() { Name = "Crystal Fox",        StarCost = 1200, IsActive = true },
            new() { Name = "Comet Core",         StarCost = 550,  IsActive = true },
            new() { Name = "Emerald Dragon Egg", StarCost = 650,  IsActive = true },
            new() { Name = "Sunset Balloon",     StarCost = 150,  IsActive = true },
            new() { Name = "Retro Cassette",     StarCost = 120,  IsActive = true },
            new() { Name = "Ocean Pearl",        StarCost = 400,  IsActive = true }
        };

        await context.Gifts.AddRangeAsync(gifts);
        await context.SaveChangesAsync();
    }
}