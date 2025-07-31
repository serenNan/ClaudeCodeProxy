namespace ClaudeCodeProxy.Host.Models;

/// <summary>
/// 更新API Key请求模型
/// </summary>
public record UpdateApiKeyRequest(
    string? Name = null,
    string? Description = null,
    DateTime? ExpiresAt = null,
    bool? IsEnabled = null
);