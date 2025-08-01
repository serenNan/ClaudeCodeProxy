using ClaudeCodeProxy.Abstraction.Chats;
using ClaudeCodeProxy.Host.Env;
using ClaudeCodeProxy.Host.Services;
using ClaudeCodeProxy.Host.Endpoints;
using ClaudeCodeProxy.Host.Filters;
using ClaudeCodeProxy.Core;
using ClaudeCodeProxy.Core.AI;
using ClaudeCodeProxy.Core.Extensions;
using ClaudeCodeProxy.EntityFrameworkCore.Sqlite;
using ClaudeCodeProxy.Host.Helper;
using Making.Jwt.Extensions;
using Making.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Sqlite;
using Scalar.AspNetCore;

namespace ClaudeCodeProxy.Host;

public static class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        EnvHelper.Initialize(builder.Configuration);

        // 配置服务
        ConfigureServices(builder.Services, builder.Configuration);

        var app = builder.Build();

        // 配置中间件管道
        ConfigureMiddleware(app);

        // 配置端点
        ConfigureEndpoints(app);

        await MigrateDatabaseAsync(app);

        await app.RunAsync();
    }

    private static async Task MigrateDatabaseAsync(WebApplication app)
    {
        // 获取配置，判断是否需要迁移
        var runMigrationsAtStartup = app.Configuration.GetValue<bool>("RunMigrationsAtStartup");

        if (!runMigrationsAtStartup)
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IContext>();

        // 执行数据库迁移
        await dbContext.MigrateAsync();
    }

    private static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.WriteIndented = true;
            options.SerializerOptions.IncludeFields = true;
            options.SerializerOptions.Converters.Add(
                new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy
                    .CamelCase));
            options.SerializerOptions.DefaultIgnoreCondition =
                System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        });
        services.AddHttpClient();
        services.AddMemoryCache();

        services.AddScoped<OAuthHelper>();

        services.AddScoped<SessionHelper>();

        // 添加Entity Framework Core with SQLite
        services.AddDbContext<MasterDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IContext>(provider => provider.GetRequiredService<MasterDbContext>());

        // 注册服务
        services.AddScoped<ApiKeyService>();
        services.AddScoped<AuthService>();
        services.AddScoped<AccountsService>();
        services.AddScoped<ClaudeProxyService>();
        services.AddScoped<StatisticsService>();

        services.AddScoped<MessageService>();

        services.AddCoreServices();

        // 添加全局过滤器
        services.AddScoped<GlobalResponseFilter>();

        // OpenAPI支持
        services.AddOpenApi();

        // 配置JSON序列化选项
        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            options.SerializerOptions.WriteIndented = true;
            options.SerializerOptions.Converters.Add(
                new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy
                    .CamelCase));
        });

        // 添加授权和认证服务
        services.AddAuthorization();
        services.AddJwtSupport(configuration);

        services.AddCors();
    }

    private static void ConfigureMiddleware(WebApplication app)
    {
        // 开发环境配置
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.MapScalarApiReference("/scalar");
        }

        // 添加CORS支持（如果需要）
        app.UseCors(policy =>
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });

        // 静态文件服务
        app.UseDefaultFiles();
        app.UseStaticFiles();

        // 认证和授权中间件
        app.UseJwtAuthentication();
    }

    private static void ConfigureEndpoints(WebApplication app)
    {
        // 添加全局过滤器到所有端点
        app.MapGroup("/")
            .AddEndpointFilter<GlobalResponseFilter>();

        // 配置API端点
        app.MapApiKeyEndpoints();
        app.MapAccountEndpoints();
        app.MapMessageEndpoints();
        app.MapAuthEndpoints();
        app.MapClaudeProxyEndpoints();
        app.MapDashboardEndpoints();

        // 健康检查端点
        app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }))
            .WithName("HealthCheck")
            .WithSummary("健康检查")
            .WithTags("System");

        // SPA fallback - 所有非API请求都返回index.html
        app.MapFallbackToFile("index.html");
    }
}