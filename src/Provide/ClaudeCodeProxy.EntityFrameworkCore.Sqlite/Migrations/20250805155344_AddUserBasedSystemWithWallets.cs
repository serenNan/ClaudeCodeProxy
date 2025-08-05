using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClaudeCodeProxy.EntityFrameworkCore.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class AddUserBasedSystemWithWallets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "StatisticsSnapshots",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "RequestLogs",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Wallets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,4)", nullable: false, defaultValue: 0m),
                    TotalUsed = table.Column<decimal>(type: "decimal(18,4)", nullable: false, defaultValue: 0m),
                    TotalRecharged = table.Column<decimal>(type: "decimal(18,4)", nullable: false, defaultValue: 0m),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "active"),
                    LastUsedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastRechargedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Wallets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Wallets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WalletTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WalletId = table.Column<int>(type: "INTEGER", nullable: false),
                    TransactionType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    RequestLogId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "completed"),
                    PaymentMethod = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    ExternalTransactionId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalletTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_RequestLogs_RequestLogId",
                        column: x => x.RequestLogId,
                        principalTable: "RequestLogs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Wallets_WalletId",
                        column: x => x.WalletId,
                        principalTable: "Wallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_SnapshotType_SnapshotDate_UserId",
                table: "StatisticsSnapshots",
                columns: new[] { "SnapshotType", "SnapshotDate", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_UserId",
                table: "StatisticsSnapshots",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_RequestDate_UserId",
                table: "RequestLogs",
                columns: new[] { "RequestDate", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_UserId",
                table: "RequestLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_UserId",
                table: "ApiKeys",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_LastUsedAt",
                table: "Wallets",
                column: "LastUsedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_Status",
                table: "Wallets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_UserId",
                table: "Wallets",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_CreatedAt",
                table: "WalletTransactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_RequestLogId",
                table: "WalletTransactions",
                column: "RequestLogId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_Status",
                table: "WalletTransactions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_TransactionType",
                table: "WalletTransactions",
                column: "TransactionType");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_WalletId",
                table: "WalletTransactions",
                column: "WalletId");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_WalletId_CreatedAt",
                table: "WalletTransactions",
                columns: new[] { "WalletId", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_ApiKeys_Users_UserId",
                table: "ApiKeys",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RequestLogs_ApiKeys_ApiKeyId",
                table: "RequestLogs",
                column: "ApiKeyId",
                principalTable: "ApiKeys",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RequestLogs_Users_UserId",
                table: "RequestLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StatisticsSnapshots_ApiKeys_ApiKeyId",
                table: "StatisticsSnapshots",
                column: "ApiKeyId",
                principalTable: "ApiKeys",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_StatisticsSnapshots_Users_UserId",
                table: "StatisticsSnapshots",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ApiKeys_Users_UserId",
                table: "ApiKeys");

            migrationBuilder.DropForeignKey(
                name: "FK_RequestLogs_ApiKeys_ApiKeyId",
                table: "RequestLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_RequestLogs_Users_UserId",
                table: "RequestLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_StatisticsSnapshots_ApiKeys_ApiKeyId",
                table: "StatisticsSnapshots");

            migrationBuilder.DropForeignKey(
                name: "FK_StatisticsSnapshots_Users_UserId",
                table: "StatisticsSnapshots");

            migrationBuilder.DropTable(
                name: "WalletTransactions");

            migrationBuilder.DropTable(
                name: "Wallets");

            migrationBuilder.DropIndex(
                name: "IX_StatisticsSnapshots_SnapshotType_SnapshotDate_UserId",
                table: "StatisticsSnapshots");

            migrationBuilder.DropIndex(
                name: "IX_StatisticsSnapshots_UserId",
                table: "StatisticsSnapshots");

            migrationBuilder.DropIndex(
                name: "IX_RequestLogs_RequestDate_UserId",
                table: "RequestLogs");

            migrationBuilder.DropIndex(
                name: "IX_RequestLogs_UserId",
                table: "RequestLogs");

            migrationBuilder.DropIndex(
                name: "IX_ApiKeys_UserId",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "StatisticsSnapshots");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "RequestLogs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "ApiKeys");
        }
    }
}
