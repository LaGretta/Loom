using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Loom.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChatInvites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatInvites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChatId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    CreatedById = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaxUses = table.Column<int>(type: "integer", nullable: true),
                    Uses = table.Column<int>(type: "integer", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatInvites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatInvites_Chats_ChatId",
                        column: x => x.ChatId,
                        principalTable: "Chats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatInvites_ChatId",
                table: "ChatInvites",
                column: "ChatId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatInvites_Code",
                table: "ChatInvites",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatInvites");
        }
    }
}
