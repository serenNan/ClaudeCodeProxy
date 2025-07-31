using ClaudeCodeProxy.Host.Models;
using ClaudeCodeProxy.Host.Services;
using ClaudeCodeProxy.Domain;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ClaudeCodeProxy.Host.Endpoints;

/// <summary>
/// API Key 相关端点
/// </summary>
public static class ApiKeyEndpoints
{
    /// <summary>
    /// 配置API Key相关路由
    /// </summary>
    public static void MapApiKeyEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/apikeys")
            .WithTags("ApiKey")
            .WithOpenApi();

        // 获取所有API Keys
        group.MapGet("/", GetApiKeys)
            .WithName("GetApiKeys")
            .WithSummary("获取所有API Keys")
            .Produces<ApiResponse<List<ApiKey>>>();

        // 根据ID获取API Key
        group.MapGet("/{id:guid}", GetApiKeyById)
            .WithName("GetApiKeyById")
            .WithSummary("根据ID获取API Key")
            .Produces<ApiResponse<ApiKey>>()
            .Produces<ApiResponse>(404);

        // 创建新的API Key
        group.MapPost("/", CreateApiKey)
            .WithName("CreateApiKey")
            .WithSummary("创建新的API Key")
            .Produces<ApiResponse<ApiKey>>(201)
            .Produces<ApiResponse>(400);

        // 更新API Key
        group.MapPut("/{id:guid}", UpdateApiKey)
            .WithName("UpdateApiKey")
            .WithSummary("更新API Key")
            .Produces<ApiResponse<ApiKey>>()
            .Produces<ApiResponse>(404)
            .Produces<ApiResponse>(400);

        // 删除API Key
        group.MapDelete("/{id:guid}", DeleteApiKey)
            .WithName("DeleteApiKey")
            .WithSummary("删除API Key")
            .Produces<ApiResponse>(204)
            .Produces<ApiResponse>(404);

        // 验证API Key
        group.MapPost("/validate", ValidateApiKey)
            .WithName("ValidateApiKey")
            .WithSummary("验证API Key")
            .Produces<ApiResponse<bool>>();
    }

    /// <summary>
    /// 获取所有API Keys
    /// </summary>
    private static async Task<Results<Ok<List<ApiKey>>, BadRequest<string>>> GetApiKeys(
        ApiKeyService apiKeyService)
    {
        try
        {
            var apiKeys = await apiKeyService.GetAllApiKeysAsync();
            return TypedResults.Ok(apiKeys);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"获取API Keys失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 根据ID获取API Key
    /// </summary>
    private static async Task<Results<Ok<ApiKey>, NotFound<string>>> GetApiKeyById(
        Guid id, 
        ApiKeyService apiKeyService)
    {
        try
        {
            var apiKey = await apiKeyService.GetApiKeyByIdAsync(id);
            if (apiKey == null)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的API Key");
            }
            
            return TypedResults.Ok(apiKey);
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"获取API Key失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 创建新的API Key
    /// </summary>
    private static async Task<Results<Created<ApiKey>, BadRequest<string>>> CreateApiKey(
        CreateApiKeyRequest request,
        ApiKeyService apiKeyService)
    {
        try
        {
            var apiKey = await apiKeyService.CreateApiKeyAsync(request);
            return TypedResults.Created($"/api/apikeys/{apiKey.Id}", apiKey);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"创建API Key失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 更新API Key
    /// </summary>
    private static async Task<Results<Ok<ApiKey>, NotFound<string>, BadRequest<string>>> UpdateApiKey(
        Guid id,
        UpdateApiKeyRequest request,
        ApiKeyService apiKeyService)
    {
        try
        {
            var apiKey = await apiKeyService.UpdateApiKeyAsync(id, request);
            if (apiKey == null)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的API Key");
            }
            
            return TypedResults.Ok(apiKey);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"更新API Key失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 删除API Key
    /// </summary>
    private static async Task<Results<NoContent, NotFound<string>>> DeleteApiKey(
        Guid id,
        ApiKeyService apiKeyService)
    {
        try
        {
            var success = await apiKeyService.DeleteApiKeyAsync(id);
            if (!success)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的API Key");
            }
            
            return TypedResults.NoContent();
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"删除API Key失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 验证API Key
    /// </summary>
    private static async Task<Results<Ok<bool>, BadRequest<string>>> ValidateApiKey(
        ValidateApiKeyRequest request,
        ApiKeyService apiKeyService)
    {
        try
        {
            var isValid = await apiKeyService.ValidateApiKeyAsync(request.Key);
            return TypedResults.Ok(isValid);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"验证API Key失败: {ex.Message}");
        }
    }
}