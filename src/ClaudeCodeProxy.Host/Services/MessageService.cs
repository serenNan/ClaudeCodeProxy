using ClaudeCodeProxy.Abstraction.Chats;
using Making.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Thor.Abstractions;
using Thor.Abstractions.Anthropic;

namespace ClaudeCodeProxy.Host.Services;

[MiniApi(Route = "/v1/messages", Tags = "Messages")]
public class MessageService
{
    public async Task HandleAsync(
        HttpContext httpContext,
        [FromServices] ApiKeyService keyService,
        [FromBody] AnthropicInput request,
        [FromServices] IAnthropicChatCompletionsService chatCompletionsService,
        CancellationToken cancellationToken = default)
    {
        var apiKey = httpContext.Request.Headers["x-api-key"].FirstOrDefault() ??
                     httpContext.Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", string.Empty);

        var apiKeyValue = await keyService.GetApiKeyAsync(apiKey, cancellationToken);

        if (string.IsNullOrEmpty(apiKey))
        {
            httpContext.Response.StatusCode = 401; // Unauthorized
            await httpContext.Response.WriteAsync("Unauthorized API Key");
            return;
        }

        if (!apiKeyValue.IsValid())
        {
            httpContext.Response.StatusCode = 403; // Forbidden
            await httpContext.Response.WriteAsJsonAsync(new
            {
                message = "Unauthorized",
                code = "403"
            }, cancellationToken: cancellationToken);
            return;
        }

        if (!apiKeyValue.CanAccessService("claude"))
        {
            httpContext.Response.StatusCode = 403; // Forbidden
            await httpContext.Response.WriteAsJsonAsync(new
            {
                message = "当前API Key没有访问Claude服务的权限",
                code = "403"
            }, cancellationToken: cancellationToken);
            return;
        }

        if (!apiKeyValue.CanUseModel(request.Model))
        {
            httpContext.Response.StatusCode = 403; // Forbidden
            await httpContext.Response.WriteAsJsonAsync(new
            {
                message = "当前API Key没有使用该模型的权限",
                code = "403"
            }, cancellationToken: cancellationToken);
            return;
        }

        if (!string.IsNullOrEmpty(apiKeyValue.Model))
        {
            request.Model = apiKeyValue.Model;
        }
        
        // 寻找对应的账号
        
    }
}