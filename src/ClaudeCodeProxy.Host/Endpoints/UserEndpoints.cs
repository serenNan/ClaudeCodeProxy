using ClaudeCodeProxy.Host.Filters;
using ClaudeCodeProxy.Host.Models;
using ClaudeCodeProxy.Host.Services;
using Microsoft.AspNetCore.Authorization;

namespace ClaudeCodeProxy.Host.Endpoints;

/// <summary>
/// 用户管理端点
/// </summary>
public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("用户管理")
            .AddEndpointFilter<GlobalResponseFilter>()
            .RequireAuthorization();

        // 获取所有用户
        group.MapGet("/", async (UserService userService) =>
            {
                var users = await userService.GetUsersAsync();
                return users;
            })
            .WithName("GetUsers")
            .WithSummary("获取所有用户")
            .Produces<ApiResponse<List<UserDto>>>();

        // 根据ID获取用户
        group.MapGet("/{id:Guid}", async (Guid id, UserService userService) =>
            {
                var user = await userService.GetUserByIdAsync(id);
                if (user == null)
                {
                    return Results.NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "用户不存在"
                    });
                }

                return Results.Ok(new ApiResponse<UserDto>
                {
                    Success = true,
                    Data = user,
                    Message = "获取用户信息成功"
                });
            })
            .WithName("GetUserById")
            .WithSummary("根据ID获取用户")
            .Produces<ApiResponse<UserDto>>();

        // 创建用户
        group.MapPost("/", async (CreateUserRequest request, UserService userService) =>
            {
                try
                {
                    var user = await userService.CreateUserAsync(request);
                    return Results.Created($"/api/users/{user.Id}", new ApiResponse<UserDto>
                    {
                        Success = true,
                        Data = user,
                        Message = "创建用户成功"
                    });
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = ex.Message
                    });
                }
            })
            .WithName("CreateUser")
            .WithSummary("创建用户")
            .Produces<ApiResponse<UserDto>>(201)
            .Produces<ApiResponse<object>>(400);

        // 更新用户
        group.MapPut("/{id:Guid}", async (Guid id, UpdateUserRequest request, UserService userService) =>
            {
                try
                {
                    var user = await userService.UpdateUserAsync(id, request);
                    if (user == null)
                    {
                        return Results.NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = "用户不存在"
                        });
                    }

                    return Results.Ok(new ApiResponse<UserDto>
                    {
                        Success = true,
                        Data = user,
                        Message = "更新用户成功"
                    });
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = ex.Message
                    });
                }
            })
            .WithName("UpdateUser")
            .WithSummary("更新用户")
            .Produces<ApiResponse<UserDto>>()
            .Produces<ApiResponse<object>>(400)
            .Produces<ApiResponse<object>>(404);

        // 删除用户
        group.MapDelete("/{id:int}", async (int id, UserService userService) =>
            {
                try
                {
                    var result = await userService.DeleteUserAsync(id);
                    if (!result)
                    {
                        return Results.NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = "用户不存在"
                        });
                    }

                    return Results.Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = "删除用户成功"
                    });
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = ex.Message
                    });
                }
            })
            .WithName("DeleteUser")
            .WithSummary("删除用户")
            .Produces<ApiResponse<object>>()
            .Produces<ApiResponse<object>>(400)
            .Produces<ApiResponse<object>>(404);

        // 修改密码
        group.MapPut("/{id:Guid}/password", async (Guid id, ChangePasswordRequest request, UserService userService) =>
            {
                try
                {
                    var result = await userService.ChangePasswordAsync(id, request);
                    if (!result)
                    {
                        return Results.NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = "用户不存在"
                        });
                    }

                    return Results.Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = "修改密码成功"
                    });
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = ex.Message
                    });
                }
            })
            .WithName("ChangePassword")
            .WithSummary("修改密码")
            .Produces<ApiResponse<object>>()
            .Produces<ApiResponse<object>>(400)
            .Produces<ApiResponse<object>>(404);

        // 重置密码（管理员功能）
        group.MapPut("/{id:int}/reset-password",
                async (int id, ResetPasswordRequest request, UserService userService) =>
                {
                    try
                    {
                        var result = await userService.ResetPasswordAsync(id, request);
                        if (!result)
                        {
                            return Results.NotFound(new ApiResponse<object>
                            {
                                Success = false,
                                Message = "用户不存在"
                            });
                        }

                        return Results.Ok(new ApiResponse<object>
                        {
                            Success = true,
                            Message = "重置密码成功"
                        });
                    }
                    catch (ArgumentException ex)
                    {
                        return Results.BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = ex.Message
                        });
                    }
                })
            .WithName("ResetPassword")
            .WithSummary("重置密码")
            .Produces<ApiResponse<object>>()
            .Produces<ApiResponse<object>>(400)
            .Produces<ApiResponse<object>>(404);

        // 获取用户登录历史
        group.MapGet("/{id:Guid}/login-history",
                async (Guid id, UserService userService, int pageIndex = 0, int pageSize = 20) =>
                {
                    var history = await userService.GetUserLoginHistoryAsync(id, pageIndex, pageSize);
                    return Results.Ok(new ApiResponse<List<UserLoginHistoryDto>>
                    {
                        Success = true,
                        Data = history,
                        Message = "获取登录历史成功"
                    });
                })
            .WithName("GetUserLoginHistory")
            .WithSummary("获取用户登录历史")
            .Produces<ApiResponse<List<UserLoginHistoryDto>>>();
    }
}