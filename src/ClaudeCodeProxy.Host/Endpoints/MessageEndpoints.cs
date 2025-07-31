using ClaudeCodeProxy.Abstraction.Chats;
using ClaudeCodeProxy.Host.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Thor.Abstractions;
using Thor.Abstractions.Anthropic;

namespace ClaudeCodeProxy.Host.Endpoints;

/// <summary>
/// 消息相关端点
/// </summary>
public static class MessageEndpoints
{
    /// <summary>
    /// 配置消息相关端点
    /// </summary>
    public static void MapMessageEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/v1/messages")
            .WithTags("Messages")
            .WithOpenApi();

        group.MapPost("/", HandleMessage)
            .WithName("HandleMessage")
            .WithSummary("处理消息请求")
            .WithDescription("处理Claude消息请求，支持流式和非流式响应");
    }

    /// <summary>
    /// 处理消息请求
    /// </summary>
    private static async Task<Results<Ok<object>, BadRequest<string>, UnauthorizedHttpResult, StatusCodeHttpResult>> HandleMessage(
        HttpContext httpContext,
        AnthropicInput request,
        ApiKeyService keyService,
        IAnthropicChatCompletionsService chatCompletionsService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 获取API Key
            var apiKey = httpContext.Request.Headers["x-api-key"].FirstOrDefault() ??
                        httpContext.Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", string.Empty);

            if (string.IsNullOrEmpty(apiKey))
            {
                return TypedResults.Unauthorized();
            }

            // 验证API Key
            var apiKeyValue = await keyService.GetApiKeyAsync(apiKey, cancellationToken);
            if (!apiKeyValue.IsValid())
            {
                return TypedResults.StatusCode(403);
            }

            // 检查服务访问权限
            if (!apiKeyValue.CanAccessService("claude"))
            {
                return TypedResults.BadRequest("当前API Key没有访问Claude服务的权限");
            }

            // 检查模型使用权限
            if (!apiKeyValue.CanUseModel(request.Model))
            {
                return TypedResults.BadRequest("当前API Key没有使用该模型的权限");
            }

            // 如果API Key指定了特定模型，则使用该模型
            if (!string.IsNullOrEmpty(apiKeyValue.Model))
            {
                request.Model = apiKeyValue.Model;
            }

            // 调用聊天完成服务
            var response = await chatCompletionsService.ChatCompletionsAsync(request, null, cancellationToken);
            
            return TypedResults.Ok<object>(response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"处理消息请求失败: {ex.Message}");
        }
    }
}