namespace ClaudeCodeProxy.Domain;

/// <summary>
/// API Key 实体类
/// </summary>
public class ApiKey : Entity<Guid>
{
    /// <summary>
    /// API Key 名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// API Key 值（加密存储）
    /// </summary>
    public string KeyValue { get; set; } = string.Empty;

    /// <summary>
    /// 备注描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 标签列表（用于分类管理）
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Token 限制（窗口内最大Token数）
    /// </summary>
    public int? TokenLimit { get; set; }

    /// <summary>
    /// 速率限制时间窗口（分钟）
    /// </summary>
    public int? RateLimitWindow { get; set; }

    /// <summary>
    /// 请求次数限制（窗口内最大请求数）
    /// </summary>
    public int? RateLimitRequests { get; set; }

    /// <summary>
    /// 并发限制（同时处理的最大请求数，0表示无限制）
    /// </summary>
    public int ConcurrencyLimit { get; set; } = 0;

    /// <summary>
    /// 每日费用限制（美元，0表示无限制）
    /// </summary>
    public decimal DailyCostLimit { get; set; } = 0;

    /// <summary>
    /// 过期时间
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// 服务权限（all=全部服务，claude=仅Claude，gemini=仅Gemini）
    /// </summary>
    public string Permissions { get; set; } = "all";

    /// <summary>
    /// 绑定的 Claude OAuth 账户ID
    /// </summary>
    public string? ClaudeAccountId { get; set; }

    /// <summary>
    /// 绑定的 Claude Console 账户ID
    /// </summary>
    public string? ClaudeConsoleAccountId { get; set; }

    /// <summary>
    /// 绑定的 Gemini 账户ID
    /// </summary>
    public string? GeminiAccountId { get; set; }

    /// <summary>
    /// 是否启用模型限制
    /// </summary>
    public bool EnableModelRestriction { get; set; } = false;

    /// <summary>
    /// 限制的模型列表
    /// </summary>
    public List<string>? RestrictedModels { get; set; }

    /// <summary>
    /// 是否启用客户端限制
    /// </summary>
    public bool EnableClientRestriction { get; set; } = false;

    /// <summary>
    /// 允许的客户端列表
    /// </summary>
    public List<string>? AllowedClients { get; set; }

    /// <summary>
    /// 是否已启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 最后使用时间
    /// </summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// 总使用次数
    /// </summary>
    public long TotalUsageCount { get; set; } = 0;

    /// <summary>
    /// 总消费金额
    /// </summary>
    public decimal TotalCost { get; set; } = 0;

    /// <summary>
    /// 如果设置了模型，则使用此模型进行请求
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// 服务类型
    /// </summary>
    /// <returns></returns>
    public string Service { get; set; } = "claude";

    public bool IsClaude()
    {
        return Service.Equals("claude", StringComparison.OrdinalIgnoreCase);
    }

    public bool IsGemini()
    {
        return Service.Equals("gemini", StringComparison.OrdinalIgnoreCase);
    }

    public bool IsOpenAI()
    {
        return Service.Equals("openai", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 检查API Key是否有效
    /// </summary>
    public bool IsValid()
    {
        return IsEnabled && (ExpiresAt == null || ExpiresAt > DateTime.UtcNow);
    }

    /// <summary>
    /// 检查是否可以访问指定服务
    /// </summary>
    public bool CanAccessService(string service)
    {
        return Permissions == "all" || Permissions == service;
    }

    /// <summary>
    /// 检查是否可以使用指定模型
    /// </summary>
    public bool CanUseModel(string model)
    {
        if (!EnableModelRestriction || RestrictedModels == null || RestrictedModels.Count == 0)
            return true;

        return !RestrictedModels.Contains(model);
    }

    /// <summary>
    /// 检查是否允许指定客户端
    /// </summary>
    public bool IsClientAllowed(string clientId)
    {
        if (!EnableClientRestriction || AllowedClients == null || AllowedClients.Count == 0)
            return true;

        return AllowedClients.Contains(clientId);
    }
}