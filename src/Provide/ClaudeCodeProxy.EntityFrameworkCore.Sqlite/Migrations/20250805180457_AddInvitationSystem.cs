using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClaudeCodeProxy.EntityFrameworkCore.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitationSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InvitationCode",
                table: "Users",
                type: "TEXT",
                maxLength: 8,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "InvitedByUserId",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "InvitationRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    InviterUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    InvitedUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    InvitationCode = table.Column<string>(type: "TEXT", maxLength: 8, nullable: false),
                    InviterReward = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    InvitedReward = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    InvitedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RewardProcessed = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvitationRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvitationRecords_Users_InvitedUserId",
                        column: x => x.InvitedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InvitationRecords_Users_InviterUserId",
                        column: x => x.InviterUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InvitationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Key = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvitationSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RedeemCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "balance"),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsUsed = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    UsedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    UsedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RedeemCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RedeemCodes_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RedeemCodes_Users_UsedByUserId",
                        column: x => x.UsedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_InvitationCode",
                table: "Users",
                column: "InvitationCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_InvitedByUserId",
                table: "Users",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvitationRecords_InvitationCode",
                table: "InvitationRecords",
                column: "InvitationCode");

            migrationBuilder.CreateIndex(
                name: "IX_InvitationRecords_InvitedAt",
                table: "InvitationRecords",
                column: "InvitedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InvitationRecords_InvitedUserId",
                table: "InvitationRecords",
                column: "InvitedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvitationRecords_InviterUserId",
                table: "InvitationRecords",
                column: "InviterUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvitationRecords_InviterUserId_InvitedAt",
                table: "InvitationRecords",
                columns: new[] { "InviterUserId", "InvitedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_InvitationRecords_RewardProcessed",
                table: "InvitationRecords",
                column: "RewardProcessed");

            migrationBuilder.CreateIndex(
                name: "IX_InvitationSettings_Key",
                table: "InvitationSettings",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RedeemCodes_Code",
                table: "RedeemCodes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RedeemCodes_CreatedByUserId",
                table: "RedeemCodes",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RedeemCodes_ExpiresAt",
                table: "RedeemCodes",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_RedeemCodes_IsEnabled",
                table: "RedeemCodes",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_RedeemCodes_IsUsed",
                table: "RedeemCodes",
                column: "IsUsed");

            migrationBuilder.CreateIndex(
                name: "IX_RedeemCodes_IsUsed_IsEnabled_ExpiresAt",
                table: "RedeemCodes",
                columns: new[] { "IsUsed", "IsEnabled", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RedeemCodes_Type",
                table: "RedeemCodes",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_RedeemCodes_UsedByUserId",
                table: "RedeemCodes",
                column: "UsedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Users_InvitedByUserId",
                table: "Users",
                column: "InvitedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Users_InvitedByUserId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "InvitationRecords");

            migrationBuilder.DropTable(
                name: "InvitationSettings");

            migrationBuilder.DropTable(
                name: "RedeemCodes");

            migrationBuilder.DropIndex(
                name: "IX_Users_InvitationCode",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_InvitedByUserId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "InvitationCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "InvitedByUserId",
                table: "Users");
        }
    }
}
