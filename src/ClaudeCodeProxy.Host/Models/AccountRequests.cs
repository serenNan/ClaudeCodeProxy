using ClaudeCodeProxy.Host.Helper;

namespace ClaudeCodeProxy.Host.Models;

/// <summary>
/// 创建账户请求模型
/// </summary>
public class CreateAccountRequest
{
    public string name { get; set; }
    
    public string description { get; set; }
    
    public string accountType { get; set; }
    
    public ProxyConfig? proxy { get; set; }
    
    public ClaudeAiOauth? claudeAiOauth { get; set; }
    
    public int priority { get; set; }
}

public class ClaudeAiOauth
{
    public string accessToken { get; set; }
    
    public string refreshToken { get; set; }
    
    public long expiresAt { get; set; }
    
    public string[] scopes { get; set; }
    
    public bool isMax { get; set; }
}

/// <summary>
/// 更新账户请求模型
/// </summary>
public record UpdateAccountRequest(
    string? Name = null,
    string? Description = null,
    string? AccountType = null,
    int? Priority = null,
    string? ProjectId = null,
    string? ApiUrl = null,
    string? ApiKey = null,
    string? UserAgent = null,
    int? RateLimitDuration = null,
    string? SupportedModels = null,
    string? ClaudeAiOauth = null,
    string? GeminiOauth = null,
    string? Proxy = null,
    bool? IsActive = null
);