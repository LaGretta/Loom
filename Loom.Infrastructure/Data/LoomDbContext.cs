using Loom.Domain.Entities;
using Loom.Domain.Entities.Chats;
using Loom.Domain.Entities.Events;
using Loom.Domain.Entities.Stars;
using Loom.Domain.Entities.Stickers;
using Loom.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;

namespace Loom.Infrastructure.Data;

public class LoomDbContext : DbContext
{
    public LoomDbContext(DbContextOptions<LoomDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<ChatMember> ChatMembers { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<MessageReaction> MessageReactions { get; set; }
    public DbSet<MessageReadReceipt> MessageReadReceipts { get; set; }
    public DbSet<StarTransaction> StarTransactions { get; set; }
    public DbSet<Gift> Gifts { get; set; }
    public DbSet<GiftInstance> GiftInstances { get; set; }
    public DbSet<StickerPack> StickerPacks { get; set; }
    public DbSet<Sticker> Stickers { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<EventRsvp> EventRsvps { get; set; }
    public DbSet<CalendarEntry> CalendarEntries { get; set; }
    public DbSet<EventShare> EventShares { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);
        mb.Entity<User>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.UserName).IsUnique();
        });

        mb.Entity<RefreshToken>(e =>
        {
            e.HasIndex(x => x.Token).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<ChatMember>(e =>
        {
            e.HasIndex(x => new { x.ChatId, x.UserId }).IsUnique();
            e.HasOne(x => x.Chat).WithMany(c => c.Members)
                .HasForeignKey(x => x.ChatId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany(u => u.Memberships)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<Message>(e =>
        {
            e.HasOne(x => x.Chat).WithMany(c => c.Messages)
                .HasForeignKey(x => x.ChatId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Sender).WithMany(u => u.Messages)
                .HasForeignKey(x => x.SenderId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ReplyToMessage).WithMany()
                .HasForeignKey(x => x.ReplyToMessageId).OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<Attachment>(e =>
        {
            e.HasOne(x => x.Message).WithMany(m => m.Attachments)
                .HasForeignKey(x => x.MessageId).OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<MessageReaction>(e =>
        {
            e.HasIndex(x => new { x.MessageId, x.UserId, x.Emoji }).IsUnique();
            e.HasOne(x => x.Message).WithMany(m => m.Reactions)
                .HasForeignKey(x => x.MessageId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        mb.Entity<MessageReadReceipt>(e =>
        {
            e.HasIndex(x => new { x.MessageId, x.UserId }).IsUnique();
            e.HasOne(x => x.Message).WithMany(m => m.ReadReceipts)
                .HasForeignKey(x => x.MessageId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        mb.Entity<StarTransaction>(e =>
        {
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        mb.Entity<GiftInstance>(e =>
        {
            e.HasOne(x => x.Gift).WithMany()
                .HasForeignKey(x => x.GiftId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Sender).WithMany()
                .HasForeignKey(x => x.SenderId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Receiver).WithMany()
                .HasForeignKey(x => x.ReceiverId).OnDelete(DeleteBehavior.Restrict);
        });
        mb.Entity<Sticker>(e =>
        {
            e.HasOne(x => x.StickerPack).WithMany(p => p.Stickers)
                .HasForeignKey(x => x.StickerPackId).OnDelete(DeleteBehavior.Cascade);
        });
        mb.Entity<Event>(e =>
        {
            e.HasOne(x => x.Chat).WithMany()
                .HasForeignKey(x => x.ChatId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.CreatedBy).WithMany()
                .HasForeignKey(x => x.CreatedById).OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<EventRsvp>(e =>
        {
            e.HasIndex(x => new { x.EventId, x.UserId }).IsUnique();
            e.HasOne(x => x.Event).WithMany(ev => ev.Rsvps)
                .HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        mb.Entity<CalendarEntry>(e =>
        {
            e.HasIndex(x => new { x.UserId, x.EventId }).IsUnique();   
            e.HasOne(x => x.Event).WithMany(ev => ev.CalendarEntries)
                .HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        mb.Entity<EventShare>(e =>
        {
            e.HasIndex(x => new { x.EventId, x.ChatId }).IsUnique();   
            e.HasOne(x => x.Event).WithMany(ev => ev.Shares)
                .HasForeignKey(x => x.EventId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}