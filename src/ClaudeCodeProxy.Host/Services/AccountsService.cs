using System.Text.Json;
using ClaudeCodeProxy.Core;
using ClaudeCodeProxy.Domain;
using ClaudeCodeProxy.Host.Models;
using Microsoft.EntityFrameworkCore;

namespace ClaudeCodeProxy.Host.Services;

/// <summary>
/// 账户服务实现
/// </summary>
public class AccountsService(IContext context)
{
    /// <summary>
    /// 获取所有账户
    /// </summary>
    public async Task<List<Accounts>> GetAllAccountsAsync(CancellationToken cancellationToken = default)
    {
        return await context.Accounts
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// 根据ID获取账户
    /// </summary>
    public async Task<Accounts?> GetAccountByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await context.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    /// <summary>
    /// 根据平台获取账户
    /// </summary>
    public async Task<List<Accounts>> GetAccountsByPlatformAsync(string platform,
        CancellationToken cancellationToken = default)
    {
        return await context.Accounts
            .AsNoTracking()
            .Where(x => x.Platform == platform)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// 创建新账户
    /// </summary>
    public async Task<Accounts> CreateAccountAsync(
        string platform,
        CreateAccountRequest request, CancellationToken cancellationToken = default)
    {
        var account = new Accounts
        {
            Id = Guid.NewGuid().ToString(),
            Platform = platform,
            Name = request.name,
            Description = request.description,
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow,
            
            ClaudeAiOauth = JsonSerializer.Serialize(request.claudeAiOauth),
            Proxy = JsonSerializer.Serialize(request.proxy)
        };

        context.Accounts.Add(account);
        await context.SaveAsync(cancellationToken);

        return account;
    }

    /// <summary>
    /// 更新账户
    /// </summary>
    public async Task<Accounts?> UpdateAccountAsync(string id, UpdateAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account == null)
        {
            return null;
        }

        if (!string.IsNullOrEmpty(request.Name))
            account.Name = request.Name;

        if (!string.IsNullOrEmpty(request.Description))
            account.Description = request.Description;

        if (request.IsActive.HasValue)
            account.IsEnabled = request.IsActive.Value;

        if (!string.IsNullOrEmpty(request.AccountType))
            account.AccountType = request.AccountType;

        if (request.Priority.HasValue)
            account.Priority = request.Priority.Value;

        if (!string.IsNullOrEmpty(request.ProjectId))
            account.ProjectId = request.ProjectId;

        if (!string.IsNullOrEmpty(request.ApiUrl))
            account.ApiUrl = request.ApiUrl;

        if (!string.IsNullOrEmpty(request.ApiKey))
            account.ApiKey = request.ApiKey;

        if (!string.IsNullOrEmpty(request.UserAgent))
            account.UserAgent = request.UserAgent;

        if (request.RateLimitDuration.HasValue)
            account.RateLimitDuration = request.RateLimitDuration.Value;

        if (!string.IsNullOrEmpty(request.SupportedModels))
            account.SupportedModels = request.SupportedModels;

        if (!string.IsNullOrEmpty(request.ClaudeAiOauth))
            account.ClaudeAiOauth = request.ClaudeAiOauth;

        if (!string.IsNullOrEmpty(request.GeminiOauth))
            account.GeminiOauth = request.GeminiOauth;

        if (!string.IsNullOrEmpty(request.Proxy))
            account.Proxy = request.Proxy;

        account.ModifiedAt = DateTime.UtcNow;

        await context.SaveAsync(cancellationToken);
        return account;
    }

    /// <summary>
    /// 删除账户
    /// </summary>
    public async Task<bool> DeleteAccountAsync(string id, CancellationToken cancellationToken = default)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account == null)
        {
            return false;
        }

        context.Accounts.Remove(account);
        await context.SaveAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 更新账户状态
    /// </summary>
    public async Task<bool> UpdateAccountStatusAsync(string id, string status,
        CancellationToken cancellationToken = default)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account == null)
        {
            return false;
        }

        account.Status = status;
        account.ModifiedAt = DateTime.UtcNow;

        await context.SaveAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 更新账户最后使用时间
    /// </summary>
    public async Task<bool> UpdateLastUsedAsync(string id, CancellationToken cancellationToken = default)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account == null)
        {
            return false;
        }

        account.LastUsedAt = DateTime.UtcNow;
        account.UsageCount++;
        account.ModifiedAt = DateTime.UtcNow;

        await context.SaveAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 设置账户限流状态
    /// </summary>
    public async Task<bool> SetRateLimitAsync(string id, DateTime rateLimitedUntil, string? error = null,
        CancellationToken cancellationToken = default)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account == null)
        {
            return false;
        }

        account.Status = "rate_limited";
        account.RateLimitedUntil = rateLimitedUntil;
        account.LastError = error;
        account.ModifiedAt = DateTime.UtcNow;

        await context.SaveAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 获取可用的账户（启用且未限流）
    /// </summary>
    public async Task<List<Accounts>> GetAvailableAccountsAsync(string? platform = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.Accounts
            .AsNoTracking()
            .Where(x => x.IsEnabled &&
                        x.Status == "active" &&
                        (x.RateLimitedUntil == null || x.RateLimitedUntil < DateTime.UtcNow));

        if (!string.IsNullOrEmpty(platform))
        {
            query = query.Where(x => x.Platform == platform);
        }

        return await query
            .OrderBy(x => x.Priority)
            .ThenBy(x => x.LastUsedAt ?? DateTime.MinValue)
            .ToListAsync(cancellationToken);
    }
}