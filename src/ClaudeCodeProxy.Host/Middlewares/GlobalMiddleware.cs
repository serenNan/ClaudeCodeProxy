namespace ClaudeCodeProxy.Host.Middlewares;

public class GlobalMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {

            await next(context);
        }
        catch (Exception e)
        {
            // 处理全局异常
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var errorResponse = new
            {
                message = e.Message,
                success = false,
            };
            await context.Response.WriteAsJsonAsync(errorResponse);
        }
    }
}