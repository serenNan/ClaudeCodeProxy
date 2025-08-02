using ClaudeCodeProxy.Abstraction;
using ClaudeCodeProxy.Abstraction.Chats;
using ClaudeCodeProxy.Core.AI;
using ClaudeCodeProxy.Host.Env;
using ClaudeCodeProxy.Host.Extensions;
using ClaudeCodeProxy.Host.Helper;
using Making.AspNetCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Thor.Abstractions;
using Thor.Abstractions.Anthropic;
using Thor.Abstractions.Chats;

namespace ClaudeCodeProxy.Host.Services;

[MiniApi(Route = "/v1/messages", Tags = "Messages")]
public partial class MessageService(
    AccountsService accountsService,
    SessionHelper sessionHelper,
    IThorChatCompletionsService thorChatCompletionsService,
    IAuthorizationService authorizationService)
{
    public async Task HandleAsync(
        HttpContext httpContext,
        [FromServices] ApiKeyService keyService,
        [FromBody] AnthropicInput request,
        [FromServices] IAnthropicChatCompletionsService chatCompletionsService)
    {
        var apiKey = httpContext.Request.Headers["x-api-key"].FirstOrDefault() ??
                     httpContext.Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", string.Empty);

        var apiKeyValue = await keyService.GetApiKeyAsync(apiKey, httpContext.RequestAborted);

        if (string.IsNullOrEmpty(apiKey))
        {
            httpContext.Response.StatusCode = 401; // Unauthorized
            await httpContext.Response.WriteAsync("Unauthorized API Key",
                cancellationToken: httpContext.RequestAborted);
            return;
        }

        if (!apiKeyValue.IsValid())
        {
            httpContext.Response.StatusCode = 403; // Forbidden
            await httpContext.Response.WriteAsJsonAsync(new
            {
                message = "Unauthorized",
                code = "403"
            }, cancellationToken: httpContext.RequestAborted);
            return;
        }

        if (!apiKeyValue.CanAccessService("claude"))
        {
            httpContext.Response.StatusCode = 403; // Forbidden
            await httpContext.Response.WriteAsJsonAsync(new
            {
                message = "当前API Key没有访问Claude服务的权限",
                code = "403"
            }, cancellationToken: httpContext.RequestAborted);
            return;
        }

        if (!apiKeyValue.CanUseModel(request.Model))
        {
            httpContext.Response.StatusCode = 403; // Forbidden
            await httpContext.Response.WriteAsJsonAsync(new
            {
                message = "当前API Key没有使用该模型的权限",
                code = "403"
            }, cancellationToken: httpContext.RequestAborted);
            return;
        }

        if (!string.IsNullOrEmpty(apiKeyValue.Model))
        {
            request.Model = apiKeyValue.Model;
        }

        var sessionHash = sessionHelper.GenerateSessionHash(request);

        var account =
            await accountsService.SelectAccountForApiKey(apiKeyValue, sessionHash, request.Model,
                httpContext.RequestAborted);

        // 获取

        // 寻找对应的账号
        if (account is { IsClaude: true })
        {
            await HandleClaudeAsync(httpContext, request, chatCompletionsService, apiKeyValue,
                account,
                httpContext.RequestAborted);
        }
        else if (account is { IsClaudeConsole: true })
        {
            await HandleClaudeAsync(httpContext, request, chatCompletionsService, apiKeyValue,
                account,
                httpContext.RequestAborted);
        }
        else if (account?.IsOpenAI == true)
        {
            await HandleOpenAIAsync(httpContext, request, apiKeyValue, account,
                httpContext.RequestAborted);
        }
        else
        {
            // 如果没有找到对应的账号，返回403 Forbidden
            httpContext.Response.StatusCode = 403; // Forbidden
            await httpContext.Response.WriteAsJsonAsync(new
            {
                message = "当前API Key没有访问Claude服务的权限",
                code = "403"
            }, cancellationToken: httpContext.RequestAborted);
        }
    }

    private async Task HandleOpenAIAsync(
        HttpContext httpContext,
        AnthropicInput request,
        Domain.ApiKey apiKeyValue,
        Domain.Accounts? account,
        CancellationToken cancellationToken = default)
    {
        // 获取统计服务
        var statisticsService = httpContext.RequestServices.GetRequiredService<StatisticsService>();

        var chatCompletionsService =
            httpContext.RequestServices.GetRequiredService<OpenAIAnthropicChatCompletionsService>();

        // 开始记录请求统计
        var requestLog = await statisticsService.LogRequestAsync(
            apiKeyValue.Id,
            apiKeyValue.Name,
            account?.Id,
            account?.Name,
            request.Model,
            "claude",
            request.Stream,
            Guid.NewGuid().ToString(),
            httpContext.Connection.RemoteIpAddress?.ToString(),
            httpContext.Request.Headers["User-Agent"].FirstOrDefault(),
            cancellationToken);

        var accessToken = await accountsService.GetValidAccessTokenAsync(account, cancellationToken);

        try
        {
            // 准备请求头和代理配置
            var headers = new Dictionary<string, string>()
            {
                { "Authorization", "Bearer " + accessToken },
                { "anthropic-version", EnvHelper.ApiVersion }
            };

            // 复制context的请求头
            // foreach (var header in httpContext.Request.Headers)
            // {
            //     // 不要覆盖已有的Authorization和Content-Type头
            //     if (header.Key.Equals("Authorization", StringComparison.OrdinalIgnoreCase) ||
            //         header.Key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase) ||
            //         header.Key.Equals("Connection", StringComparison.OrdinalIgnoreCase) ||
            //         header.Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase))
            //     {
            //         continue;
            //     }
            //
            //     headers[header.Key] = header.Value.ToString();
            // }

            headers["anthropic-beta"] = EnvHelper.BetaHeader;

            var proxyConfig = account?.Proxy;

            // 调用真实的聊天完成服务
            ClaudeChatCompletionDto response;
            // 从response中提取实际的token usage信息
            var inputTokens = 0;
            var outputTokens = 0;
            var cacheCreateTokens = 0;
            var cacheReadTokens = 0;

            if (request.Stream)
            {
                // 是否第一次输出
                bool isFirst = true;

                await foreach (var (eventName, value, item) in chatCompletionsService.StreamChatCompletionsAsync(
                                   request,
                                   headers, proxyConfig, new ThorPlatformOptions()
                                   {
                                       Address = account?.ApiUrl ?? "https://api.anthropic.com/",
                                   }, cancellationToken))
                {
                    if (isFirst)
                    {
                        httpContext.SetEventStreamHeaders();
                        isFirst = false;
                    }

                    if (item?.Usage is { input_tokens: > 0 } ||
                        item?.message?.Usage?.input_tokens > 0)
                    {
                        inputTokens = item.Usage?.input_tokens ?? item?.message?.Usage?.input_tokens ?? 0;
                    }

                    if (item?.Usage is { output_tokens: > 0 } || item?.message?.Usage?.output_tokens > 0)
                    {
                        outputTokens = (item.Usage?.output_tokens ?? item?.message?.Usage?.output_tokens) ?? 0;
                    }

                    if (item?.Usage is { cache_creation_input_tokens: > 0 } ||
                        item?.message?.Usage?.cache_creation_input_tokens > 0)
                    {
                        cacheCreateTokens += item.Usage?.cache_creation_input_tokens ??
                                             item?.message?.Usage?.cache_creation_input_tokens ?? 0;
                    }

                    if (item?.Usage is { cache_read_input_tokens: > 0 } ||
                        item?.message?.Usage?.cache_read_input_tokens > 0)
                    {
                        cacheReadTokens += item.Usage?.cache_read_input_tokens ??
                                           item.message?.Usage?.cache_read_input_tokens ?? 0;
                    }


                    await httpContext.WriteAsEventStreamDataAsync(eventName, value);
                }
            }

            else
            {
                // 非流式响应
                response = await chatCompletionsService.ChatCompletionsAsync(request, headers, proxyConfig,
                    new ThorPlatformOptions()
                    {
                        Address = account.ApiUrl,
                    },
                    cancellationToken);
                await httpContext.Response.WriteAsJsonAsync(response, cancellationToken: cancellationToken);
            }

            // 计算费用（这里需要根据实际的定价模型来计算）
            var cost = CalculateTokenCost(request.Model, inputTokens, outputTokens, cacheCreateTokens,
                cacheReadTokens);

            // 注意：我们不能直接修改实体然后保存，需要通过服务方法来更新
            // 这里只是增加使用计数，具体的更新逻辑应该在服务层处理
            // 可以考虑创建专门的方法来更新使用统计

            // 完成请求日志记录（成功）
            await statisticsService.CompleteRequestLogAsync(
                requestLog.Id,
                inputTokens: inputTokens,
                outputTokens: outputTokens,
                cacheCreateTokens: cacheCreateTokens,
                cacheReadTokens: cacheReadTokens,
                cost: cost,
                status: "success",
                httpStatusCode: 200,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            // 完成请求日志记录（失败）
            await statisticsService.CompleteRequestLogAsync(
                requestLog.Id,
                status: "error",
                errorMessage: ex.Message,
                httpStatusCode: 500,
                cancellationToken: cancellationToken);

            httpContext.Response.StatusCode = 500;
            await httpContext.Response.WriteAsJsonAsync(new
            {
                // 返回claude需要的异常
                error = new
                {
                    message = ex.Message,
                    type = "server_error",
                    code = "500"
                }
            }, cancellationToken: cancellationToken);
        }
    }

    /// <summary>
    /// 处理系统提示词 - 如果不是真实的Claude Code请求，需要添加Claude Code系统提示词
    /// </summary>
    /// <param name="request">AnthropicInput请求</param>
    /// <param name="httpContext">HTTP上下文</param>
    private void ProcessSystemPrompts(AnthropicInput request, HttpContext httpContext)
    {
        // 判断是否是真实的Claude Code请求
        var isRealClaudeCode = IsClaudeCodeRequest(httpContext);

        // 如果不是真实的Claude Code请求，需要设置Claude Code系统提示词
        if (!isRealClaudeCode)
        {
            var claudeCodePrompt = new AnthropicMessageContent
            {
                Type = "text",
                Text = PromptConstant.ClaudeCodeSystemPrompt,
                CacheControl = new AnthropicCacheControl { Type = "ephemeral" }
            };

            if (request.SystemCalculated != null)
            {
                if (request.System != null)
                {
                    // 字符串格式：转换为数组，Claude Code 提示词在第一位
                    var userSystemPrompt = new AnthropicMessageContent
                    {
                        Type = "text",
                        Text = request.System
                    };

                    // 如果用户的提示词与Claude Code提示词相同，只保留一个
                    if (request.System.Trim() == PromptConstant.ClaudeCodeSystemPrompt)
                    {
                        request.Systems = new List<AnthropicMessageContent> { claudeCodePrompt };
                    }
                    else
                    {
                        request.Systems = new List<AnthropicMessageContent> { claudeCodePrompt, userSystemPrompt };
                    }

                    request.System = null;
                }
                else if (request.Systems != null)
                {
                    // 检查第一个元素是否是Claude Code系统提示词
                    var firstItem = request.Systems.FirstOrDefault();
                    var isFirstItemClaudeCode = firstItem != null &&
                                                firstItem.Type == "text" &&
                                                firstItem.Text == PromptConstant.ClaudeCodeSystemPrompt;

                    if (!isFirstItemClaudeCode)
                    {
                        // 如果第一个不是Claude Code提示词，需要在开头插入
                        // 同时检查数组中是否有其他位置包含Claude Code提示词，如果有则移除
                        var filteredSystem = request.Systems
                            .Where(item =>
                                !(item != null && item.Type == "text" &&
                                  item.Text == PromptConstant.ClaudeCodeSystemPrompt))
                            .ToList();

                        var newSystems = new List<AnthropicMessageContent> { claudeCodePrompt };
                        newSystems.AddRange(filteredSystem);
                        request.Systems = newSystems;
                    }
                }
            }
            else
            {
                // 用户没有传递system，需要添加Claude Code提示词
                request.Systems = new List<AnthropicMessageContent> { claudeCodePrompt };
            }

            request.System = null;

            request.Systems.Insert(0, new AnthropicMessageContent
            {
                Type = "text",
                Text = PromptConstant.ClaudeCliSystemPrompt,
                CacheControl = new AnthropicCacheControl { Type = "ephemeral" }
            });
        }
    }

    /// <summary>
    /// 处理Claude请求
    /// </summary>
    private async Task HandleClaudeAsync(
        HttpContext httpContext,
        AnthropicInput request,
        IAnthropicChatCompletionsService chatCompletionsService,
        Domain.ApiKey apiKeyValue,
        Domain.Accounts? account,
        CancellationToken cancellationToken = default)
    {
        // 获取统计服务
        var statisticsService = httpContext.RequestServices.GetRequiredService<StatisticsService>();

        // 开始记录请求统计
        var requestLog = await statisticsService.LogRequestAsync(
            apiKeyValue.Id,
            apiKeyValue.Name,
            account?.Id,
            account?.Name,
            request.Model,
            "claude",
            request.Stream,
            Guid.NewGuid().ToString(),
            httpContext.Connection.RemoteIpAddress?.ToString(),
            httpContext.Request.Headers["User-Agent"].FirstOrDefault(),
            cancellationToken);

        var accessToken = await accountsService.GetValidAccessTokenAsync(account, cancellationToken);

        // 处理系统提示词 - 如果不是真实的Claude Code请求，需要添加Claude Code系统提示词
        ProcessSystemPrompts(request, httpContext);

        try
        {
            // 准备请求头和代理配置
            var headers = new Dictionary<string, string>()
            {
                { "Authorization", "Bearer " + accessToken },
                { "anthropic-version", EnvHelper.ApiVersion }
            };

            if (IsClaudeCodeRequest(httpContext))
            {
                // 复制context的请求头
                foreach (var header in httpContext.Request.Headers)
                {
                    // 不要覆盖已有的Authorization和Content-Type头
                    if (header.Key.Equals("Authorization", StringComparison.OrdinalIgnoreCase) ||
                        header.Key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase) ||
                        header.Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase) ||
                        header.Key.Equals("x-api-key", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    headers[header.Key] = header.Value.ToString();
                }
            }
            else
            {
                headers["User-Agent"] = "claude-cli/1.0.67 (external,cli)";
                headers["Accept-Encoding"] = "gzip, deflate, br";
                headers["Accept-Language"] = "*";
                headers["X-Stainless-Retry-Count"] = "0";
                headers["x-Stainless-Timeout"] = "60";
                headers["X-Stainless-Lang"] = "js";
                headers["X-Stainless-Package-Version"] = "0.55.1";
                headers["X-Stainless-OS"] = "Windows";
                headers["X-Stainless-Arch"] = "x64";
                headers["X-Stainless-Runtime"] = "node";
                headers["X-Stainless-Runtime-Version"] = "v22.15.0";
                headers["anthropic-dangerous-direct-browser-access"] = "true";
                headers["x-app"] = "cli";
                headers["sec-fetch-mode"] = "cors";
                headers["sec-fetch-site"] = "cross-site";
                headers["sec-fetch-dest"] = "empty";
            }


            headers["anthropic-beta"] = EnvHelper.BetaHeader;

            var proxyConfig = account?.Proxy;

            // 调用真实的聊天完成服务
            ClaudeChatCompletionDto response;
            // 从response中提取实际的token usage信息
            var inputTokens = 0;
            var outputTokens = 0;
            var cacheCreateTokens = 0;
            var cacheReadTokens = 0;

            if (request.Stream)
            {
                // 是否第一次输出
                bool isFirst = true;

                await foreach (var (eventName, value, item) in chatCompletionsService.StreamChatCompletionsAsync(
                                   request,
                                   headers, proxyConfig, new ThorPlatformOptions()
                                   {
                                       Address = account?.ApiUrl ?? "https://api.anthropic.com/",
                                   }, cancellationToken))
                {
                    if (isFirst)
                    {
                        httpContext.SetEventStreamHeaders();
                        isFirst = false;
                    }

                    if (item?.Usage is { input_tokens: > 0 } ||
                        item?.message?.Usage?.input_tokens > 0)
                    {
                        inputTokens = item.Usage?.input_tokens ?? item?.message?.Usage?.input_tokens ?? 0;
                    }

                    if (item?.Usage is { output_tokens: > 0 } || item?.message?.Usage?.output_tokens > 0)
                    {
                        outputTokens = (item.Usage?.output_tokens ?? item?.message?.Usage?.output_tokens) ?? 0;
                    }

                    if (item?.Usage is { cache_creation_input_tokens: > 0 } ||
                        item?.message?.Usage?.cache_creation_input_tokens > 0)
                    {
                        cacheCreateTokens += item.Usage?.cache_creation_input_tokens ??
                                             item?.message?.Usage?.cache_creation_input_tokens ?? 0;
                    }

                    if (item?.Usage is { cache_read_input_tokens: > 0 } ||
                        item?.message?.Usage?.cache_read_input_tokens > 0)
                    {
                        cacheReadTokens += item.Usage?.cache_read_input_tokens ??
                                           item.message?.Usage?.cache_read_input_tokens ?? 0;
                    }


                    await httpContext.WriteAsEventStreamDataAsync(eventName, value);
                }
            }

            else
            {
                // 非流式响应
                response = await chatCompletionsService.ChatCompletionsAsync(request, headers, proxyConfig,
                    new ThorPlatformOptions()
                    {
                        Address = account.ApiUrl,
                    },
                    cancellationToken);
                await httpContext.Response.WriteAsJsonAsync(response, cancellationToken: cancellationToken);
            }

            // 计算费用（这里需要根据实际的定价模型来计算）
            var cost = CalculateTokenCost(request.Model, inputTokens, outputTokens, cacheCreateTokens,
                cacheReadTokens);

            // 注意：我们不能直接修改实体然后保存，需要通过服务方法来更新
            // 这里只是增加使用计数，具体的更新逻辑应该在服务层处理
            // 可以考虑创建专门的方法来更新使用统计

            // 完成请求日志记录（成功）
            await statisticsService.CompleteRequestLogAsync(
                requestLog.Id,
                inputTokens: inputTokens,
                outputTokens: outputTokens,
                cacheCreateTokens: cacheCreateTokens,
                cacheReadTokens: cacheReadTokens,
                cost: cost,
                status: "success",
                httpStatusCode: 200,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            // 完成请求日志记录（失败）
            await statisticsService.CompleteRequestLogAsync(
                requestLog.Id,
                status: "error",
                errorMessage: ex.Message,
                httpStatusCode: 500,
                cancellationToken: cancellationToken);

            httpContext.Response.StatusCode = 500;
            await httpContext.Response.WriteAsJsonAsync(new
            {
                // 返回claude需要的异常
                error = new
                {
                    message = ex.Message,
                    type = "server_error",
                    code = "500"
                }
            }, cancellationToken: cancellationToken);
        }
    }

    /// <summary>
    /// 计算Token费用
    /// </summary>
    private static decimal CalculateTokenCost(string model, int inputTokens, int outputTokens,
        int cacheCreateTokens,
        int cacheReadTokens)
    {
        // 根据不同模型的定价来计算费用
        // 这里是示例定价，实际应该从配置中读取
        var pricing = model switch
        {
            "claude-3-5-sonnet-20241022" => new
                { Input = 0.000003m, Output = 0.000015m, CacheWrite = 0.00000375m, CacheRead = 0.0000003m },
            "claude-3-5-haiku-20241022" => new
                { Input = 0.000001m, Output = 0.000005m, CacheWrite = 0.00000125m, CacheRead = 0.0000001m },
            "claude-3-opus-20240229" => new
                { Input = 0.000015m, Output = 0.000075m, CacheWrite = 0.00001875m, CacheRead = 0.0000015m },
            _ => new
            {
                Input = 0.000003m, Output = 0.000015m, CacheWrite = 0.00000375m, CacheRead = 0.0000003m
            } // 默认使用sonnet定价
        };

        var inputCost = inputTokens * pricing.Input;
        var outputCost = outputTokens * pricing.Output;
        var cacheCreateCost = cacheCreateTokens * pricing.CacheWrite;
        var cacheReadCost = cacheReadTokens * pricing.CacheRead;

        return inputCost + outputCost + cacheCreateCost + cacheReadCost;
    }

    /// <summary>
    /// 判断当前请求是否Claude Code发起，如果是则需要提供默认的请求头
    /// </summary>
    /// <returns></returns>
    private bool IsClaudeCodeRequest(HttpContext httpContext)
    {
        // 检查是否有特定的请求头或标识符来判断是否是Claude Code发起的请求
        // 这里可以根据实际情况调整
        return httpContext.Request.Headers.UserAgent.ToString()
            .Contains("claude-cli", StringComparison.OrdinalIgnoreCase);
    }
}