using ClaudeCodeProxy.Domain;
using Thor.Abstractions;
using Thor.Abstractions.Anthropic;

namespace ClaudeCodeProxy.Abstraction.Chats;

public interface IAnthropicChatCompletionsService
{
    /// <summary>
    /// 非流式对话补全
    /// </summary>
    /// <param name="request">对话补全请求参数对象</param>
    /// <param name="headers"></param>
    /// <param name="config"></param>
    /// <param name="options">平台参数对象</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns></returns>
    Task<ClaudeChatCompletionDto> ChatCompletionsAsync(AnthropicInput input,
        Dictionary<string, string> headers,
        ProxyConfig? config,
        ThorPlatformOptions? options = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 流式对话补全
    /// </summary>
    /// <param name="request">对话补全请求参数对象</param>
    /// <param name="headers"></param>
    /// <param name="config"></param>
    /// <param name="options">平台参数对象</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns></returns>
    IAsyncEnumerable<(string,string, ClaudeStreamDto?)> StreamChatCompletionsAsync(AnthropicInput request,
        Dictionary<string, string> headers,
        ProxyConfig? config,
        ThorPlatformOptions? options = null,
        CancellationToken cancellationToken = default);
}