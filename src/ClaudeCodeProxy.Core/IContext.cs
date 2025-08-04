using ClaudeCodeProxy.Domain;
using Microsoft.EntityFrameworkCore;

namespace ClaudeCodeProxy.Core;

public interface IContext
{
    DbSet<Accounts> Accounts { get; set; }

    DbSet<ApiKey> ApiKeys { get; set; }
    
    public DbSet<RequestLog> RequestLogs { get; set; }
    
    public DbSet<StatisticsSnapshot> StatisticsSnapshots { get; set; }
    
    public DbSet<ModelPricing> ModelPricings { get; set; }


    /// <summary>
    /// 保存上下文数据
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    Task SaveAsync(CancellationToken cancellationToken = default);

    Task MigrateAsync();
}