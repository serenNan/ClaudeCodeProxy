using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClaudeCodeProxy.EntityFrameworkCore.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Platform = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    AccountType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "shared"),
                    Priority = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 50),
                    ProjectId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ApiUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ApiKey = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    UserAgent = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    RateLimitDuration = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 60),
                    SupportedModels = table.Column<string>(type: "TEXT", nullable: true),
                    ClaudeAiOauth = table.Column<string>(type: "TEXT", nullable: true),
                    GeminiOauth = table.Column<string>(type: "TEXT", nullable: true),
                    Proxy = table.Column<string>(type: "TEXT", nullable: true),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "active"),
                    LastUsedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastError = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    RateLimitedUntil = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UsageCount = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ApiKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    KeyValue = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Tags = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    TokenLimit = table.Column<int>(type: "INTEGER", nullable: true),
                    RateLimitWindow = table.Column<int>(type: "INTEGER", nullable: true),
                    RateLimitRequests = table.Column<int>(type: "INTEGER", nullable: true),
                    ConcurrencyLimit = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    DailyCostLimit = table.Column<decimal>(type: "decimal(18,4)", nullable: false, defaultValue: 0m),
                    MonthlyCostLimit = table.Column<decimal>(type: "TEXT", nullable: false),
                    TotalCostLimit = table.Column<decimal>(type: "TEXT", nullable: false),
                    DailyCostUsed = table.Column<decimal>(type: "TEXT", nullable: false),
                    MonthlyCostUsed = table.Column<decimal>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Permissions = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "all"),
                    ClaudeAccountId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ClaudeConsoleAccountId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    GeminiAccountId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    EnableModelRestriction = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    RestrictedModels = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    EnableClientRestriction = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    AllowedClients = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    LastUsedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TotalUsageCount = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    TotalCost = table.Column<decimal>(type: "decimal(18,4)", nullable: false, defaultValue: 0m),
                    Model = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Service = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "claude"),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiKeys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModelPricings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Model = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    InputPrice = table.Column<decimal>(type: "decimal(18,9)", nullable: false),
                    OutputPrice = table.Column<decimal>(type: "decimal(18,9)", nullable: false),
                    CacheWritePrice = table.Column<decimal>(type: "decimal(18,9)", nullable: false, defaultValue: 0m),
                    CacheReadPrice = table.Column<decimal>(type: "decimal(18,9)", nullable: false, defaultValue: 0m),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false, defaultValue: "USD"),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelPricings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RequestLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ApiKeyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ApiKeyName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    AccountId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    AccountName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Model = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    RequestStartTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RequestEndTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DurationMs = table.Column<long>(type: "INTEGER", nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "success"),
                    ErrorMessage = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    HttpStatusCode = table.Column<int>(type: "INTEGER", nullable: true),
                    InputTokens = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    OutputTokens = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    CacheCreateTokens = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    CacheReadTokens = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    TotalTokens = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Cost = table.Column<decimal>(type: "decimal(18,6)", nullable: false, defaultValue: 0m),
                    ClientIp = table.Column<string>(type: "TEXT", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    RequestId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IsStreaming = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    Platform = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "claude"),
                    RequestDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RequestHour = table.Column<int>(type: "INTEGER", nullable: false),
                    Metadata = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StatisticsSnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    SnapshotType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SnapshotDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SnapshotHour = table.Column<int>(type: "INTEGER", nullable: true),
                    ApiKeyId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Model = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    RequestCount = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    SuccessfulRequestCount = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    FailedRequestCount = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    InputTokens = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    OutputTokens = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    CacheCreateTokens = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    CacheReadTokens = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    TotalTokens = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    TotalCost = table.Column<decimal>(type: "decimal(18,6)", nullable: false, defaultValue: 0m),
                    AverageResponseTime = table.Column<double>(type: "REAL", nullable: true),
                    MaxResponseTime = table.Column<long>(type: "INTEGER", nullable: true),
                    MinResponseTime = table.Column<long>(type: "INTEGER", nullable: true),
                    ActiveApiKeyCount = table.Column<int>(type: "INTEGER", nullable: true),
                    ActiveAccountCount = table.Column<int>(type: "INTEGER", nullable: true),
                    RateLimitedAccountCount = table.Column<int>(type: "INTEGER", nullable: true),
                    UniqueUserCount = table.Column<int>(type: "INTEGER", nullable: true),
                    Version = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 1L),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatisticsSnapshots", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_AccountType",
                table: "Accounts",
                column: "AccountType");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_CreatedAt",
                table: "Accounts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_IsEnabled",
                table: "Accounts",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Name",
                table: "Accounts",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Platform",
                table: "Accounts",
                column: "Platform");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Platform_IsEnabled_Status",
                table: "Accounts",
                columns: new[] { "Platform", "IsEnabled", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Priority",
                table: "Accounts",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Status",
                table: "Accounts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_CreatedAt",
                table: "ApiKeys",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_IsEnabled",
                table: "ApiKeys",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_Name",
                table: "ApiKeys",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_Service",
                table: "ApiKeys",
                column: "Service");

            migrationBuilder.CreateIndex(
                name: "IX_ModelPricings_Currency",
                table: "ModelPricings",
                column: "Currency");

            migrationBuilder.CreateIndex(
                name: "IX_ModelPricings_IsEnabled",
                table: "ModelPricings",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_ModelPricings_Model",
                table: "ModelPricings",
                column: "Model",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_ApiKeyId",
                table: "RequestLogs",
                column: "ApiKeyId");

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_Model",
                table: "RequestLogs",
                column: "Model");

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_Platform",
                table: "RequestLogs",
                column: "Platform");

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_RequestDate",
                table: "RequestLogs",
                column: "RequestDate");

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_RequestDate_ApiKeyId",
                table: "RequestLogs",
                columns: new[] { "RequestDate", "ApiKeyId" });

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_RequestDate_Model",
                table: "RequestLogs",
                columns: new[] { "RequestDate", "Model" });

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_RequestStartTime",
                table: "RequestLogs",
                column: "RequestStartTime");

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_RequestStartTime_RequestHour",
                table: "RequestLogs",
                columns: new[] { "RequestStartTime", "RequestHour" });

            migrationBuilder.CreateIndex(
                name: "IX_RequestLogs_Status",
                table: "RequestLogs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_ApiKeyId",
                table: "StatisticsSnapshots",
                column: "ApiKeyId");

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_Model",
                table: "StatisticsSnapshots",
                column: "Model");

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_SnapshotDate",
                table: "StatisticsSnapshots",
                column: "SnapshotDate");

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_SnapshotType",
                table: "StatisticsSnapshots",
                column: "SnapshotType");

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_SnapshotType_SnapshotDate",
                table: "StatisticsSnapshots",
                columns: new[] { "SnapshotType", "SnapshotDate" });

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_SnapshotType_SnapshotDate_ApiKeyId",
                table: "StatisticsSnapshots",
                columns: new[] { "SnapshotType", "SnapshotDate", "ApiKeyId" });

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_SnapshotType_SnapshotDate_Model",
                table: "StatisticsSnapshots",
                columns: new[] { "SnapshotType", "SnapshotDate", "Model" });

            migrationBuilder.CreateIndex(
                name: "IX_StatisticsSnapshots_SnapshotType_SnapshotDate_SnapshotHour",
                table: "StatisticsSnapshots",
                columns: new[] { "SnapshotType", "SnapshotDate", "SnapshotHour" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "ApiKeys");

            migrationBuilder.DropTable(
                name: "ModelPricings");

            migrationBuilder.DropTable(
                name: "RequestLogs");

            migrationBuilder.DropTable(
                name: "StatisticsSnapshots");
        }
    }
}
