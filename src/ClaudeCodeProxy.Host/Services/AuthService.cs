using ClaudeCodeProxy.Host.Env;
using ClaudeCodeProxy.Host.Models;
using Making.Jwt;
using Making.Jwt.Models;
using Making.Jwt.Services;

namespace ClaudeCodeProxy.Host.Services;

/// <summary>
/// 认证服务实现
/// </summary>
public class AuthService(IJwtService jwtService)
{
    /// <summary>
    /// 用户登录
    /// </summary>
    /// <param name="request">登录请求</param>
    /// <returns>登录响应</returns>
    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // 验证用户名和密码
        if (!ValidateCredentials(request.Username, request.Password))
        {
            return null;
        }

        // 创建JWT声明
        var claims = new JwtClaims
        {
            UserId = Guid.Empty,
            UserName = request.Username,
            Email = $"{request.Username}@example.com",
            Roles = ["Admin"]
        };

        // 生成JWT令牌
        var tokenResult = await jwtService.GenerateTokenAsync(claims);

        return new LoginResponse
        {
            AccessToken = tokenResult.AccessToken,
            RefreshToken = tokenResult.RefreshToken,
            TokenType = "Bearer",
            ExpiresIn = (int)TimeSpan.FromDays(7).TotalSeconds, // 7天过期
            Username = request.Username
        };
    }

    /// <summary>
    /// 验证用户凭据
    /// </summary>
    /// <param name="username">用户名</param>
    /// <param name="password">密码</param>
    /// <returns>验证结果</returns>
    private bool ValidateCredentials(string username, string password)
    {
        // 从环境变量获取配置的用户名和密码
        return string.Equals(username, EnvHelper.UserName, StringComparison.OrdinalIgnoreCase) &&
               string.Equals(password, EnvHelper.Password, StringComparison.Ordinal);
    }
}