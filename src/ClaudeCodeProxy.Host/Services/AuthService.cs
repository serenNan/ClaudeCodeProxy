using ClaudeCodeProxy.Host.Env;
using ClaudeCodeProxy.Host.Models;
using Making.Jwt;
using Making.Jwt.Models;
using Making.Jwt.Services;
using System.Text.Json;

namespace ClaudeCodeProxy.Host.Services;

/// <summary>
/// 认证服务实现
/// </summary>
public class AuthService(IJwtService jwtService, UserService userService, IInvitationService invitationService)
{
    /// <summary>
    /// 用户登录
    /// </summary>
    /// <param name="request">登录请求</param>
    /// <param name="ipAddress">IP地址</param>
    /// <param name="userAgent">用户代理</param>
    /// <returns>登录响应</returns>
    public async Task<LoginResponse?> LoginAsync(LoginRequest request, string? ipAddress = null, string? userAgent = null)
    {
        try
        {
            // 首先尝试数据库用户验证
            var user = await userService.ValidateUserAsync(request.Username, request.Password);
            
            if (user != null)
            {
                // 记录登录历史
                await userService.RecordLoginHistoryAsync(user.Id, "password", ipAddress, userAgent, true);

                // 创建JWT声明
                var claims = new JwtClaims
                {
                    UserId = user.Id, // 生成一个新的Guid，但在NameIdentifier中存储真实的用户ID
                    UserName = user.Username,
                    Email = user.Email,
                    Roles = [user.Role.Name],
                    // 添加自定义声明来存储真实的用户ID
                    CustomClaims = new Dictionary<string, object>
                    {
                        [System.Security.Claims.ClaimTypes.NameIdentifier] = user.Id.ToString()
                    }
                };

                // 生成JWT令牌
                var tokenResult = await jwtService.GenerateTokenAsync(claims);

                return new LoginResponse
                {
                    AccessToken = tokenResult.AccessToken,
                    RefreshToken = tokenResult.RefreshToken,
                    TokenType = "Bearer",
                    ExpiresIn = (int)TimeSpan.FromDays(7).TotalSeconds,
                    Username = user.Username,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Username = user.Username,
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Avatar = user.Avatar,
                        IsActive = user.IsActive,
                        EmailConfirmed = user.EmailConfirmed,
                        LastLoginAt = user.LastLoginAt,
                        Provider = user.Provider,
                        ProviderId = user.ProviderId,
                        RoleId = user.RoleId,
                        RoleName = user.Role.Name,
                        CreatedAt = user.CreatedAt,
                        ModifiedAt = user.ModifiedAt
                    }
                };
            }

            // 如果数据库验证失败，尝试环境变量验证（向后兼容）
            if (ValidateCredentials(request.Username, request.Password))
            {
                var claims = new JwtClaims
                {
                    UserId = user.Id,
                    UserName = request.Username,
                    Email = $"{request.Username}@example.com",
                    Roles = ["Admin"],
                    // 为环境变量用户使用固定的用户ID 0（管理员）
                    CustomClaims = new Dictionary<string, object>
                    {
                        [System.Security.Claims.ClaimTypes.NameIdentifier] = "0"
                    }
                };

                var tokenResult = await jwtService.GenerateTokenAsync(claims);

                return new LoginResponse
                {
                    AccessToken = tokenResult.AccessToken,
                    RefreshToken = tokenResult.RefreshToken,
                    TokenType = "Bearer",
                    ExpiresIn = (int)TimeSpan.FromDays(7).TotalSeconds,
                    Username = request.Username
                };
            }

            return null;
        }
        catch (Exception)
        {
            return null;
        }
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

    /// <summary>
    /// 用户注册
    /// </summary>
    /// <param name="request">注册请求</param>
    /// <param name="ipAddress">IP地址</param>
    /// <param name="userAgent">用户代理</param>
    /// <returns>注册响应</returns>
    public async Task<LoginResponse?> RegisterAsync(RegisterUserRequest request, string? ipAddress = null, string? userAgent = null)
    {
        try
        {
            // 注册用户
            var user = await userService.RegisterUserAsync(request, invitationService);

            // 记录登录历史
            await userService.RecordLoginHistoryAsync(user.Id, "register", ipAddress, userAgent, true);

            // 创建JWT声明
            var claims = new JwtClaims
            {
                UserId = user.Id,
                UserName = user.Username,
                Email = user.Email,
                Roles = [user.RoleName],
                // 添加自定义声明来存储真实的用户ID
                CustomClaims = new Dictionary<string, object>
                {
                    [System.Security.Claims.ClaimTypes.NameIdentifier] = user.Id.ToString()
                }
            };

            // 生成JWT令牌
            var tokenResult = await jwtService.GenerateTokenAsync(claims);

            return new LoginResponse
            {
                AccessToken = tokenResult.AccessToken,
                RefreshToken = tokenResult.RefreshToken,
                TokenType = "Bearer",
                ExpiresIn = (int)TimeSpan.FromDays(7).TotalSeconds,
                Username = user.Username,
                User = new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Avatar = user.Avatar,
                    IsActive = user.IsActive,
                    EmailConfirmed = user.EmailConfirmed,
                    LastLoginAt = user.LastLoginAt,
                    Provider = user.Provider,
                    ProviderId = user.ProviderId,
                    RoleId = user.RoleId,
                    RoleName = user.RoleName,
                    CreatedAt = user.CreatedAt,
                    ModifiedAt = user.ModifiedAt
                }
            };
        }
        catch (Exception ex)
        {
            throw new ApplicationException($"注册失败: {ex.Message}", ex);
        }
    }
}