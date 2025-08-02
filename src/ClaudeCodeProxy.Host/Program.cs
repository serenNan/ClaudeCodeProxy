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
using Serilog;
using System.Runtime.InteropServices;

namespace ClaudeCodeProxy.Host;

public static class Program
{
    public static async Task Main(string[] args)
    {
        // 处理命令行参数
        if (await HandleCommandLineArgumentsAsync(args))
        {
            return;
        }

        var builder = WebApplication.CreateBuilder(new WebApplicationOptions()
        {
            Args = args,
            ContentRootPath = AppDomain.CurrentDomain.BaseDirectory,
        });

        // 如果是Windows系统，配置为Windows服务
        if (WindowsServiceHelper.IsWindows())
        {
            builder.Host.UseWindowsService();
        }

        EnvHelper.Initialize(builder.Configuration);

        // 配置服务
        ConfigureServices(builder.Services, builder.Configuration);
        ConfigureSerilog(builder.Services, builder.Configuration);

        var app = builder.Build();

        // 配置中间件管道
        ConfigureMiddleware(app);

        // 配置端点
        ConfigureEndpoints(app);

        await MigrateDatabaseAsync(app);

        // 如果是Windows且未安装服务，提示用户
        if (WindowsServiceHelper.IsWindows() && !await WindowsServiceHelper.IsServiceInstalledAsync())
        {
            Log.Information("检测到Windows系统，建议安装为Windows服务。");
            Log.Information("运行 '{ExecutableName} --install-service' 以管理员身份安装服务",
                Environment.ProcessPath ?? "ClaudeCodeProxy.Host.exe");
        }

        await app.RunAsync();
    }

    private static async Task<bool> HandleCommandLineArgumentsAsync(string[] args)
    {
        if (args.Length == 0)
            return false;

        var command = args[0].ToLowerInvariant();

        switch (command)
        {
            case "--install-service":
            case "/install-service":
                await WindowsServiceHelper.InstallServiceAsync();
                return true;

            case "--uninstall-service":
            case "/uninstall-service":
                await WindowsServiceHelper.UninstallServiceAsync();
                return true;

            case "--start-service":
            case "/start-service":
                await WindowsServiceHelper.StartServiceAsync();
                return true;

            case "--stop-service":
            case "/stop-service":
                await WindowsServiceHelper.StopServiceAsync();
                return true;

            case "--service-status":
            case "/service-status":
                await WindowsServiceHelper.ShowServiceStatusAsync();
                return true;

            case "--help":
            case "/help":
            case "-h":
            case "/h":
                ShowHelp();
                return true;

            default:
                return false;
        }
    }

    private static void ShowHelp()
    {
        var executableName = Path.GetFileNameWithoutExtension(Environment.ProcessPath) ?? "ClaudeCodeProxy.Host";

        Console.WriteLine("Claude Code Proxy Host");
        Console.WriteLine("用法:");
        Console.WriteLine($"  {executableName}                    启动应用程序");
        Console.WriteLine($"  {executableName} --help             显示此帮助信息");
        Console.WriteLine();
        Console.WriteLine("Windows服务管理 (需要管理员权限):");
        Console.WriteLine($"  {executableName} --install-service   安装为Windows服务");
        Console.WriteLine($"  {executableName} --uninstall-service 卸载Windows服务");
        Console.WriteLine($"  {executableName} --start-service     启动Windows服务");
        Console.WriteLine($"  {executableName} --stop-service      停止Windows服务");
        Console.WriteLine($"  {executableName} --service-status    显示Windows服务状态");
        Console.WriteLine();
        Console.WriteLine("注意: 在Windows系统上，建议安装为系统服务以获得更好的稳定性和自动启动功能。");
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

    private static void ConfigureSerilog(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSerilog();

        var loggerConfig = new LoggerConfiguration()
            .ReadFrom.Configuration(configuration)
            .Enrich.FromLogContext()
            .WriteTo.Console();

        // 如果是Windows服务模式，添加文件日志
        if (WindowsServiceHelper.IsWindows())
        {
            // 自动创建目录
            var logDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data");
            if (!Directory.Exists(logDirectory))
            {
                Directory.CreateDirectory(logDirectory);
            }

            var logPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "logs", "claude-code-proxy-.log");
            loggerConfig.WriteTo.File(
                logPath,
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                shared: true,
                flushToDiskInterval: TimeSpan.FromSeconds(1));
        }

        Log.Logger = loggerConfig.CreateLogger();

        services.AddLogging(loggingBuilder =>
        {
            loggingBuilder.ClearProviders();
            loggingBuilder.AddSerilog(Log.Logger, dispose: true);
        });
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

        // 系统信息端点
        app.MapGet("/system-info", () =>
            {
                var info = new
                {
                    Version = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version?.ToString(),
                    Framework = RuntimeInformation.FrameworkDescription,
                    OS = RuntimeInformation.OSDescription,
                    Architecture = RuntimeInformation.OSArchitecture.ToString(),
                    IsWindows = WindowsServiceHelper.IsWindows(),
                    ProcessId = Environment.ProcessId,
                    WorkingDirectory = Environment.CurrentDirectory,
                    MachineName = Environment.MachineName,
                    UserName = Environment.UserName,
                    Timestamp = DateTime.UtcNow
                };
                return Results.Ok(info);
            })
            .WithName("SystemInfo")
            .WithSummary("系统信息")
            .WithTags("System");

        // SPA fallback - 所有非API请求都返回index.html
        app.MapFallbackToFile("index.html");
    }
}