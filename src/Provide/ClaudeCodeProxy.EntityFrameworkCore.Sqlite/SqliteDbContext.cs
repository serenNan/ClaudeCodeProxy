using ClaudeCodeProxy.Core;
using Microsoft.EntityFrameworkCore;

namespace ClaudeCodeProxy.EntityFrameworkCore.Sqlite;

public class SqliteDbContext : MasterDbContext
{
    public SqliteDbContext(DbContextOptions<SqliteDbContext> options) : base(CreateMasterDbContextOptions(options))
    {
    }

    private static DbContextOptions<MasterDbContext> CreateMasterDbContextOptions(DbContextOptions<SqliteDbContext> options)
    {
        var builder = new DbContextOptionsBuilder<MasterDbContext>();
        builder.UseSqlite(options.Extensions.OfType<Microsoft.EntityFrameworkCore.Infrastructure.RelationalOptionsExtension>().First().ConnectionString);
        return builder.Options;
    }
}