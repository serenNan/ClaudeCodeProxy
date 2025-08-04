using System;

class Program
{
    static void Main()
    {
        // 用户的计算公式：
        // 输入单价 * (文字输入 + 创建缓存Tokens * 1.25 + 命中缓存Tokens * 0.1 + 文字输出 * 补全倍率)
        
        Console.WriteLine("=== 用户提供的新计算公式 ===");
        Console.WriteLine("公式: 输入单价 × (文字输入 + 创建缓存Tokens × 1.25 + 命中缓存Tokens × 0.1 + 文字输出 × 补全倍率)");
        Console.WriteLine();
        
        // 用户的示例验证
        Console.WriteLine("用户示例验证:");
        decimal basePrice = 0.002m / 1000m; // $0.002 per 1000 tokens
        int textInput = 4;
        int cacheCreate = 0;
        int cacheRead = 0;
        int textOutput = 245;
        decimal outputMultiplier = 5m;
        
        decimal exampleCost = basePrice * (textInput + cacheCreate * 1.25m + cacheRead * 0.1m + textOutput * outputMultiplier);
        Console.WriteLine($"${0.002m:F3}/1000 × ({textInput} + {cacheCreate}×1.25 + {cacheRead}×0.1 + {textOutput}×{outputMultiplier}) = ${exampleCost:F6}");
        Console.WriteLine($"预期: $0.002458, 计算结果: ${exampleCost:F6} ✓");
        Console.WriteLine();
        
        // 应用到问题案例: 18,917输入, 8输出
        Console.WriteLine("应用到问题案例 (18,917输入, 8输出):");
        
        // 如果使用相同的基础价格和倍率
        int problemInput = 18917;
        int problemOutput = 8;
        decimal problemCost = basePrice * (problemInput + 0 * 1.25m + 0 * 0.1m + problemOutput * outputMultiplier);
        Console.WriteLine($"使用相同参数: ${0.002m:F3}/1000 × ({problemInput} + 0×1.25 + 0×0.1 + {problemOutput}×{outputMultiplier}) = ${problemCost:F6}");
        
        // 反推：如果期望 $0.018950，需要什么参数？
        decimal expectedCost = 0.018950m;
        Console.WriteLine($"期望费用: ${expectedCost:F6}");
        
        // 假设没有缓存，反推基础价格
        decimal requiredBasePrice = expectedCost / (problemInput + problemOutput * outputMultiplier);
        Console.WriteLine($"需要的基础价格: ${requiredBasePrice * 1000:F6}/1000");
        
        // 或者反推输出倍率（使用$0.002/1000的基础价格）
        decimal requiredMultiplier = (expectedCost / basePrice - problemInput) / problemOutput;
        Console.WriteLine($"需要的输出倍率: {requiredMultiplier:F2}");
        
        Console.WriteLine();
        Console.WriteLine("=== 可能的模型参数 ===");
        
        // 测试几种可能的模型参数组合
        var modelParams = new[]
        {
            new { Name = "Claude Haiku", BasePrice = 0.00025m, OutputMult = 5m },
            new { Name = "Claude Sonnet", BasePrice = 0.003m, OutputMult = 5m },
            new { Name = "Kimi (USD)", BasePrice = 0.000556m, OutputMult = 5m },
            new { Name = "Custom 1", BasePrice = 0.001m, OutputMult = 5m },
            new { Name = "Custom 2", BasePrice = 0.002m, OutputMult = 1m },
        };
        
        foreach (var model in modelParams)
        {
            decimal modelBasePricePer1000 = model.BasePrice / 1000m;
            decimal modelCost = modelBasePricePer1000 * (problemInput + problemOutput * model.OutputMult);
            Console.WriteLine($"{model.Name}: ${model.BasePrice:F6}/1000 × ({problemInput} + {problemOutput}×{model.OutputMult}) = ${modelCost:F6}");
        }
    }
}