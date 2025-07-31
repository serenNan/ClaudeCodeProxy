using ClaudeCodeProxy.Host.Models;
using ClaudeCodeProxy.Host.Services;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ClaudeCodeProxy.Host.Endpoints;

/// <summary>
/// 认证相关端点
/// </summary>
public static class AuthEndpoints
{
    /// <summary>
    /// 配置认证相关端点
    /// </summary>
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Authentication")
            .WithOpenApi();

        group.MapPost("/login", Login)
            .WithName("Login")
            .WithSummary("用户登录")
            .WithDescription("使用用户名和密码进行登录，返回JWT令牌")
            .AllowAnonymous();
    }

    /// <summary>
    /// 用户登录
    /// </summary>
    private static async Task<Results<Ok<LoginResponse>, UnauthorizedHttpResult, BadRequest<string>>> Login(
        LoginRequest request,
        AuthService authService)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return TypedResults.BadRequest("用户名和密码不能为空");
            }

            var loginResponse = await authService.LoginAsync(request);
            if (loginResponse == null)
            {
                return TypedResults.Unauthorized();
            }

            return TypedResults.Ok(loginResponse);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"登录失败: {ex.Message}");
        }
    }
}