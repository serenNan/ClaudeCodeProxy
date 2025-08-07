using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ClaudeCodeProxy.Core;

public class UserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? GetCurrentUserId()
    {
        var user = GetCurrentUser();
        var value = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (Guid.TryParse(value, out var userId))
        {
            return userId;
        }

        return null;
    }

    public ClaimsPrincipal? GetCurrentUser()
    {
        return _httpContextAccessor.HttpContext?.User;
    }

    public bool IsAuthenticated()
    {
        var user = GetCurrentUser();
        return user?.Identity?.IsAuthenticated ?? false;
    }

    public string? GetCurrentUserRole()
    {
        var user = GetCurrentUser();
        return user?.FindFirst(ClaimTypes.Role)?.Value;
    }

    public bool IsAdmin()
    {
        var user = GetCurrentUser();
        return user?.IsInRole("Admin") ?? false;
    }
}