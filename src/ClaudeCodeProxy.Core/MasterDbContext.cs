using System.Security.Claims;
using System.Text.Json;
using ClaudeCodeProxy.Domain;
using Microsoft.EntityFrameworkCore;

namespace ClaudeCodeProxy.Core;

public class MasterDbContext(DbContextOptions<MasterDbContext> options) : DbContext(options), IContext
{
    public DbSet<Accounts> Accounts { get; set; }
    public DbSet<ApiKey> ApiKeys { get; set; }
    public DbSet<RequestLog> RequestLogs { get; set; }
    public DbSet<StatisticsSnapshot> StatisticsSnapshots { get; set; }

    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        ProcessAuditableEntities();
        await SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 配置 ApiKey 实体
        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.ToTable("ApiKeys");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.KeyValue)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Description)
                .HasMaxLength(1000);

            entity.Property(e => e.Permissions)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("all");

            entity.Property(e => e.Service)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("claude");

            entity.Property(e => e.Model)
                .HasMaxLength(100);

            // 账户关联字段
            entity.Property(e => e.ClaudeAccountId)
                .HasMaxLength(100);

            entity.Property(e => e.ClaudeConsoleAccountId)
                .HasMaxLength(100);

            entity.Property(e => e.GeminiAccountId)
                .HasMaxLength(100);

            // 数值类型配置
            entity.Property(e => e.ConcurrencyLimit)
                .HasDefaultValue(0);

            entity.Property(e => e.DailyCostLimit)
                .HasColumnType("decimal(18,4)")
                .HasDefaultValue(0m);

            entity.Property(e => e.TotalCost)
                .HasColumnType("decimal(18,4)")
                .HasDefaultValue(0m);

            entity.Property(e => e.TotalUsageCount)
                .HasDefaultValue(0L);

            // 布尔类型配置
            entity.Property(e => e.EnableModelRestriction)
                .HasDefaultValue(false);

            entity.Property(e => e.EnableClientRestriction)
                .HasDefaultValue(false);

            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true);

            // JSON 字段配置
            entity.Property(e => e.Tags)
                .HasConversion(
                    v => v == null ? null : string.Join(',', v),
                    v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
                .HasMaxLength(2000);

            entity.Property(e => e.RestrictedModels)
                .HasConversion(
                    v => v == null ? null : string.Join(',', v),
                    v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
                .HasMaxLength(2000);

            entity.Property(e => e.AllowedClients)
                .HasConversion(
                    v => v == null ? null : string.Join(',', v),
                    v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
                .HasMaxLength(2000);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 索引配置
            entity.HasIndex(e => e.Name)
                .HasDatabaseName("IX_ApiKeys_Name");

            entity.HasIndex(e => e.Service)
                .HasDatabaseName("IX_ApiKeys_Service");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("IX_ApiKeys_IsEnabled");

            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("IX_ApiKeys_CreatedAt");
        });

        // 配置 Accounts 实体
        modelBuilder.Entity<Accounts>(entity =>
        {
            entity.ToTable("Accounts");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.Id)
                .HasMaxLength(100);

            entity.Property(e => e.Platform)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Description)
                .HasMaxLength(1000);

            entity.Property(e => e.AccountType)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("shared");

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("active");

            // 数值类型配置
            entity.Property(e => e.Priority)
                .HasDefaultValue(50);

            entity.Property(e => e.RateLimitDuration)
                .HasDefaultValue(60);

            entity.Property(e => e.UsageCount)
                .HasDefaultValue(0L);

            // 平台特定字段
            entity.Property(e => e.ProjectId)
                .HasMaxLength(100);

            entity.Property(e => e.ApiUrl)
                .HasMaxLength(500);

            entity.Property(e => e.ApiKey)
                .HasMaxLength(500);

            entity.Property(e => e.UserAgent)
                .HasMaxLength(500);

            // JSON 配置字段
            entity.Property(e => e.SupportedModels)
                .HasConversion(
                    v => v == null ? null : string.Join(',', v),
                    v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
                .HasColumnType("TEXT");

            entity.Property(e => e.ClaudeAiOauth)
                .HasConversion(
                    v => v == null
                        ? null
                        : JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                    v => v == null
                        ? null
                        : JsonSerializer.Deserialize<ClaudeAiOauth>(v,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }))
                .HasColumnType("TEXT");

            entity.Property(e => e.GeminiOauth)
                .HasColumnType("TEXT");

            entity.Property(e => e.Proxy)
                .HasConversion(
                    v => v == null
                        ? null
                        : JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                    v => v == null
                        ? null
                        : JsonSerializer.Deserialize<ProxyConfig>(v,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }))
                .HasColumnType("TEXT");

            entity.Property(e => e.LastError)
                .HasMaxLength(2000);

            // 布尔类型配置
            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 索引配置
            entity.HasIndex(e => e.Platform)
                .HasDatabaseName("IX_Accounts_Platform");

            entity.HasIndex(e => e.Name)
                .HasDatabaseName("IX_Accounts_Name");

            entity.HasIndex(e => e.AccountType)
                .HasDatabaseName("IX_Accounts_AccountType");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_Accounts_Status");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("IX_Accounts_IsEnabled");

            entity.HasIndex(e => e.Priority)
                .HasDatabaseName("IX_Accounts_Priority");

            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("IX_Accounts_CreatedAt");

            // 复合索引
            entity.HasIndex(e => new { e.Platform, e.IsEnabled, e.Status })
                .HasDatabaseName("IX_Accounts_Platform_IsEnabled_Status");
        });

        // 配置 RequestLog 实体
        modelBuilder.Entity<RequestLog>(entity =>
        {
            entity.ToTable("RequestLogs");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.ApiKeyId)
                .IsRequired();

            entity.Property(e => e.ApiKeyName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.AccountId)
                .HasMaxLength(100);

            entity.Property(e => e.AccountName)
                .HasMaxLength(200);

            entity.Property(e => e.Model)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.RequestStartTime)
                .IsRequired();

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("success");

            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(2000);

            entity.Property(e => e.Platform)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("claude");

            entity.Property(e => e.ClientIp)
                .HasMaxLength(45); // IPv6最大长度

            entity.Property(e => e.UserAgent)
                .HasMaxLength(500);

            entity.Property(e => e.RequestId)
                .HasMaxLength(100);

            entity.Property(e => e.Metadata)
                .HasColumnType("TEXT");

            // 数值类型配置
            entity.Property(e => e.InputTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.OutputTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.CacheCreateTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.CacheReadTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.TotalTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.Cost)
                .HasColumnType("decimal(18,6)")
                .HasDefaultValue(0m);

            entity.Property(e => e.IsStreaming)
                .HasDefaultValue(false);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 索引配置
            entity.HasIndex(e => e.ApiKeyId)
                .HasDatabaseName("IX_RequestLogs_ApiKeyId");

            entity.HasIndex(e => e.RequestStartTime)
                .HasDatabaseName("IX_RequestLogs_RequestStartTime");

            entity.HasIndex(e => e.RequestDate)
                .HasDatabaseName("IX_RequestLogs_RequestDate");

            entity.HasIndex(e => e.Model)
                .HasDatabaseName("IX_RequestLogs_Model");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_RequestLogs_Status");

            entity.HasIndex(e => e.Platform)
                .HasDatabaseName("IX_RequestLogs_Platform");

            // 复合索引（用于性能优化）
            entity.HasIndex(e => new { e.RequestDate, e.ApiKeyId })
                .HasDatabaseName("IX_RequestLogs_RequestDate_ApiKeyId");

            entity.HasIndex(e => new { e.RequestDate, e.Model })
                .HasDatabaseName("IX_RequestLogs_RequestDate_Model");

            entity.HasIndex(e => new { e.RequestStartTime, e.RequestHour })
                .HasDatabaseName("IX_RequestLogs_RequestStartTime_RequestHour");
        });

        // 配置 StatisticsSnapshot 实体
        modelBuilder.Entity<StatisticsSnapshot>(entity =>
        {
            entity.ToTable("StatisticsSnapshots");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.SnapshotType)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(e => e.SnapshotDate)
                .IsRequired();

            entity.Property(e => e.Model)
                .HasMaxLength(100);

            // 数值类型配置
            entity.Property(e => e.RequestCount)
                .HasDefaultValue(0L);

            entity.Property(e => e.SuccessfulRequestCount)
                .HasDefaultValue(0L);

            entity.Property(e => e.FailedRequestCount)
                .HasDefaultValue(0L);

            entity.Property(e => e.InputTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.OutputTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.CacheCreateTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.CacheReadTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.TotalTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.TotalCost)
                .HasColumnType("decimal(18,6)")
                .HasDefaultValue(0m);

            entity.Property(e => e.Version)
                .HasDefaultValue(1L);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 索引配置
            entity.HasIndex(e => e.SnapshotType)
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType");

            entity.HasIndex(e => e.SnapshotDate)
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotDate");

            entity.HasIndex(e => e.ApiKeyId)
                .HasDatabaseName("IX_StatisticsSnapshots_ApiKeyId");

            entity.HasIndex(e => e.Model)
                .HasDatabaseName("IX_StatisticsSnapshots_Model");

            // 复合索引（用于性能优化）
            entity.HasIndex(e => new { e.SnapshotType, e.SnapshotDate })
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType_SnapshotDate");

            entity.HasIndex(e => new { e.SnapshotType, e.SnapshotDate, e.SnapshotHour })
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType_SnapshotDate_SnapshotHour");

            entity.HasIndex(e => new { e.SnapshotType, e.SnapshotDate, e.ApiKeyId })
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType_SnapshotDate_ApiKeyId");

            entity.HasIndex(e => new { e.SnapshotType, e.SnapshotDate, e.Model })
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType_SnapshotDate_Model");
        });
    }

    public async Task MigrateAsync()
    {
        await base.Database.EnsureCreatedAsync();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ProcessAuditableEntities();
        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ProcessAuditableEntities();
        return base.SaveChanges();
    }

    private void ProcessAuditableEntities()
    {
        var currentUser = string.Empty;
        var currentTime = DateTime.Now;

        var auditableEntries = ChangeTracker.Entries<IAuditable>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in auditableEntries)
        {
            var entity = entry.Entity;

            switch (entry.State)
            {
                case EntityState.Added:
                    entity.CreatedAt = currentTime;
                    entity.CreatedBy = currentUser;
                    break;
                case EntityState.Modified:
                    entity.ModifiedAt = currentTime;
                    entity.ModifiedBy = currentUser;

                    // 确保创建时间和创建者不被修改
                    entry.Property(nameof(entity.CreatedAt)).IsModified = false;
                    entry.Property(nameof(entity.CreatedBy)).IsModified = false;
                    break;
            }
        }
    }
}