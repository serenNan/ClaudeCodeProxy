using ClaudeCodeProxy.Domain;
using ClaudeCodeProxy.Host.Services;
using ClaudeCodeProxy.Host.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ClaudeCodeProxy.Host.Endpoints;

/// <summary>
/// 账户相关端点
/// </summary>
public static class AccountEndpoints
{
    /// <summary>
    /// 配置账户相关路由
    /// </summary>
    public static void MapAccountEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/accounts")
            .WithTags("Account")
            .WithOpenApi();

        // 获取所有账户
        group.MapGet("/", GetAccounts)
            .WithName("GetAccounts")
            .WithSummary("获取所有账户")
            .Produces<List<Accounts>>();

        // 根据ID获取账户
        group.MapGet("/{id}", GetAccountById)
            .WithName("GetAccountById")
            .WithSummary("根据ID获取账户")
            .Produces<Accounts>()
            .Produces(404);

        // 创建新账户
        group.MapPost("/{platform}", CreateAccount)
            .WithName("CreateAccount")
            .WithSummary("创建新账户")
            .Produces<Accounts>(201)
            .Produces(400);

        // 更新账户
        group.MapPut("/{id}", UpdateAccount)
            .WithName("UpdateAccount")
            .WithSummary("更新账户")
            .Produces<Accounts>()
            .Produces(404)
            .Produces(400);

        // 删除账户
        group.MapDelete("/{id}", DeleteAccount)
            .WithName("DeleteAccount")
            .WithSummary("删除账户")
            .Produces(204)
            .Produces(404);

        // 根据平台获取账户
        group.MapGet("/platform/{platform}", GetAccountsByPlatform)
            .WithName("GetAccountsByPlatform")
            .WithSummary("根据平台获取账户")
            .Produces<List<Accounts>>();

        // 获取可用账户
        group.MapGet("/available", GetAvailableAccounts)
            .WithName("GetAvailableAccounts")
            .WithSummary("获取可用账户")
            .Produces<List<Accounts>>();

        // 更新账户状态
        group.MapPatch("/{id}/status", UpdateAccountStatus)
            .WithName("UpdateAccountStatus")
            .WithSummary("更新账户状态")
            .Produces(200)
            .Produces(404);

        // 更新账户使用时间
        group.MapPatch("/{id}/usage", UpdateAccountUsage)
            .WithName("UpdateAccountUsage")
            .WithSummary("更新账户使用时间")
            .Produces(200)
            .Produces(404);
    }

    /// <summary>
    /// 获取所有账户
    /// </summary>
    private static async Task<Results<Ok<List<Accounts>>, BadRequest<string>>> GetAccounts(
        AccountsService accountsService)
    {
        try
        {
            var accounts = await accountsService.GetAllAccountsAsync();
            return TypedResults.Ok(accounts);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"获取账户失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 根据ID获取账户
    /// </summary>
    private static async Task<Results<Ok<Accounts>, NotFound<string>>> GetAccountById(
        string id,
        AccountsService accountsService)
    {
        try
        {
            var account = await accountsService.GetAccountByIdAsync(id);

            if (account == null)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的账户");
            }

            return TypedResults.Ok(account);
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"获取账户失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 创建新账户
    /// </summary>
    private static async Task<Results<Created<Accounts>, BadRequest<string>>> CreateAccount(
        string platform,
        CreateAccountRequest request,
        AccountsService accountsService)
    {
        try
        {
            var account = await accountsService.CreateAccountAsync(platform, request);
            return TypedResults.Created($"/api/accounts/{account.Id}", account);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"创建账户失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 更新账户
    /// </summary>
    private static async Task<Results<Ok<Accounts>, NotFound<string>, BadRequest<string>>> UpdateAccount(
        string id,
        UpdateAccountRequest request,
        AccountsService accountsService)
    {
        try
        {
            var account = await accountsService.UpdateAccountAsync(id, request);
            if (account == null)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的账户");
            }

            return TypedResults.Ok(account);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"更新账户失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 删除账户
    /// </summary>
    private static async Task<Results<NoContent, NotFound<string>>> DeleteAccount(
        string id,
        AccountsService accountsService)
    {
        try
        {
            var success = await accountsService.DeleteAccountAsync(id);
            if (!success)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的账户");
            }

            return TypedResults.NoContent();
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"删除账户失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 根据平台获取账户
    /// </summary>
    private static async Task<Results<Ok<List<Accounts>>, BadRequest<string>>> GetAccountsByPlatform(
        string platform,
        AccountsService accountsService)
    {
        try
        {
            var accounts = await accountsService.GetAccountsByPlatformAsync(platform);
            return TypedResults.Ok(accounts);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"获取平台账户失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 获取可用账户
    /// </summary>
    private static async Task<Results<Ok<List<Accounts>>, BadRequest<string>>> GetAvailableAccounts(
        string? platform,
        AccountsService accountsService)
    {
        try
        {
            var accounts = await accountsService.GetAvailableAccountsAsync(platform);
            return TypedResults.Ok(accounts);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"获取可用账户失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 更新账户状态
    /// </summary>
    private static async Task<Results<Ok, NotFound<string>>> UpdateAccountStatus(
        string id,
        string status,
        AccountsService accountsService)
    {
        try
        {
            var success = await accountsService.UpdateAccountStatusAsync(id, status);
            if (!success)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的账户");
            }

            return TypedResults.Ok();
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"更新账户状态失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 更新账户使用时间
    /// </summary>
    private static async Task<Results<Ok, NotFound<string>>> UpdateAccountUsage(
        string id,
        AccountsService accountsService)
    {
        try
        {
            var success = await accountsService.UpdateLastUsedAsync(id);
            if (!success)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的账户");
            }

            return TypedResults.Ok();
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"更新账户使用时间失败: {ex.Message}");
        }
    }
}