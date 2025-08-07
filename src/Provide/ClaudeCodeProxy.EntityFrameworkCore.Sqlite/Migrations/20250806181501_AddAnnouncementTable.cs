using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClaudeCodeProxy.EntityFrameworkCore.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnouncementTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Announcements",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    IsVisible = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    BackgroundColor = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true, defaultValue: "bg-blue-50"),
                    TextColor = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true, defaultValue: "text-blue-800"),
                    Priority = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    StartTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EndTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Announcements", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_CreatedAt",
                table: "Announcements",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_EndTime",
                table: "Announcements",
                column: "EndTime");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_IsVisible",
                table: "Announcements",
                column: "IsVisible");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_IsVisible_Priority_CreatedAt",
                table: "Announcements",
                columns: new[] { "IsVisible", "Priority", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_Priority",
                table: "Announcements",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_StartTime",
                table: "Announcements",
                column: "StartTime");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Announcements");
        }
    }
}
