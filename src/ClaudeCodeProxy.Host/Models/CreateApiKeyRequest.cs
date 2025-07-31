namespace ClaudeCodeProxy.Host.Endpoints;

/// <summary>
/// 创建API Key请求模型
/// </summary>
public record CreateApiKeyRequest(
    string Name,
    string? Description = null,
    DateTime? ExpiresAt = null,
    bool IsEnabled = true
);