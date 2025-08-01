using ClaudeCodeProxy.Abstraction.Chats;
using ClaudeCodeProxy.Core.AI;
using Microsoft.Extensions.DependencyInjection;

namespace ClaudeCodeProxy.Core.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddCoreServices(this IServiceCollection services)
    {
        // 添加核心服务
        services.AddScoped<IAnthropicChatCompletionsService, AnthropicChatService>();
        return services;
    }
}