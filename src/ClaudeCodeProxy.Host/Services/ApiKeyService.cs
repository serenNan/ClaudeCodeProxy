using ClaudeCodeProxy.Core;
using ClaudeCodeProxy.Domain;
using ClaudeCodeProxy.Host.Endpoints;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using ClaudeCodeProxy.Host.Models;

namespace ClaudeCodeProxy.Host.Services;

public class ApiKeyService(IContext context)
{
    public async Task<ApiKey> GetApiKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        var apiKey = await context.ApiKeys
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.KeyValue == key, cancellationToken);

        if (apiKey != null)
        {
            await context.ApiKeys
                .Where(x => x.Id == apiKey.Id)
                .ExecuteUpdateAsync(x => x.SetProperty(y => y.LastUsedAt, DateTime.UtcNow), cancellationToken);
        }

        return apiKey;
    }

    /// <summary>
    /// 获取所有API Keys
    /// </summary>
    public async Task<List<ApiKey>> GetAllApiKeysAsync(CancellationToken cancellationToken = default)
    {
        return await context.ApiKeys
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// 根据ID获取API Key
    /// </summary>
    public async Task<ApiKey?> GetApiKeyByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.ApiKeys
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    /// <summary>
    /// 创建新的API Key
    /// </summary>
    public async Task<ApiKey> CreateApiKeyAsync(CreateApiKeyRequest request,
        CancellationToken cancellationToken = default)
    {
        var keyValue = GenerateApiKey();

        var apiKey = new ApiKey
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            KeyValue = keyValue,
            Description = request.Description,
            Tags = request.Tags,
            TokenLimit = request.TokenLimit,
            RateLimitWindow = request.RateLimitWindow,
            RateLimitRequests = request.RateLimitRequests,
            ConcurrencyLimit = request.ConcurrencyLimit,
            DailyCostLimit = request.DailyCostLimit,
            ExpiresAt = request.ExpiresAt,
            Permissions = request.Permissions,
            ClaudeAccountId = request.ClaudeAccountId,
            ClaudeConsoleAccountId = request.ClaudeConsoleAccountId,
            GeminiAccountId = request.GeminiAccountId,
            EnableModelRestriction = request.EnableModelRestriction,
            RestrictedModels = request.RestrictedModels,
            EnableClientRestriction = request.EnableClientRestriction,
            AllowedClients = request.AllowedClients,
            IsEnabled = request.IsEnabled,
            Model = request.Model,
            Service = request.Service,
            CreatedAt = DateTime.UtcNow
        };

        context.ApiKeys.Add(apiKey);
        await context.SaveAsync(cancellationToken);

        return apiKey;
    }

    /// <summary>
    /// 更新API Key
    /// </summary>
    public async Task<ApiKey?> UpdateApiKeyAsync(Guid id, UpdateApiKeyRequest request,
        CancellationToken cancellationToken = default)
    {
        var apiKey = await context.ApiKeys.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (apiKey == null)
        {
            return null;
        }

        if (!string.IsNullOrEmpty(request.Name))
            apiKey.Name = request.Name;

        if (request.Description != null)
            apiKey.Description = request.Description;

        if (request.ExpiresAt.HasValue)
            apiKey.ExpiresAt = request.ExpiresAt.Value;

        if (request.IsEnabled.HasValue)
            apiKey.IsEnabled = request.IsEnabled.Value;

        apiKey.ModifiedAt = DateTime.UtcNow;
        apiKey.Model = request.Model;

        await context.SaveAsync(cancellationToken);
        return apiKey;
    }

    /// <summary>
    /// 删除API Key
    /// </summary>
    public async Task<bool> DeleteApiKeyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var apiKey = await context.ApiKeys.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (apiKey == null)
        {
            return false;
        }

        context.ApiKeys.Remove(apiKey);
        await context.SaveAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 启用API Key
    /// </summary>
    public async Task<bool> EnableApiKeyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await context.ApiKeys.Where(x => x.Id == id)
            .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsEnabled, true)
                .SetProperty(a => a.ModifiedAt, DateTime.UtcNow), cancellationToken);

        // 检查是否有记录被更新
        var apiKey = await context.ApiKeys.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return apiKey != null;
    }

    /// <summary>
    /// 禁用API Key
    /// </summary>
    public async Task<bool> DisableApiKeyAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await context.ApiKeys.Where(x => x.Id == id)
            .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsEnabled, false)
                .SetProperty(a => a.ModifiedAt, DateTime.UtcNow), cancellationToken);

        // 检查是否有记录被更新
        var apiKey = await context.ApiKeys.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return apiKey != null;
    }

    /// <summary>
    /// 切换API Key启用状态
    /// </summary>
    public async Task<bool> ToggleApiKeyEnabledAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var apiKey = await context.ApiKeys.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (apiKey == null)
        {
            return false;
        }

        apiKey.IsEnabled = !apiKey.IsEnabled;
        apiKey.ModifiedAt = DateTime.UtcNow;

        await context.SaveAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 验证API Key
    /// </summary>
    public async Task<bool> ValidateApiKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        var apiKey = await GetApiKeyAsync(key, cancellationToken);

        if (apiKey == null || !apiKey.IsEnabled)
            return false;

        if (apiKey.ExpiresAt.HasValue && apiKey.ExpiresAt.Value < DateTime.UtcNow)
            return false;

        return true;
    }

    /// <summary>
    /// 生成API Key
    /// </summary>
    private static string GenerateApiKey()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[64];
        rng.GetBytes(bytes);
        return "sk-ant-" + Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}