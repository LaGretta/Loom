using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;

namespace Loom.API.Workers;
public class TokenCleanupWorker : BackgroundService
{
    private readonly ILogger<TokenCleanupWorker> _logger;
    private readonly IServiceProvider _serviceProvider;

    public TokenCleanupWorker(
        ILogger<TokenCleanupWorker> logger
        , IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // створюємо scope бо репозиторій/IUnitOfWork — Scoped а воркер Singleton
                using var scope = _serviceProvider.CreateScope();

                var authRepo = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
                var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                var deleted = await authRepo.DeleteExpiredRefreshTokensAsync(stoppingToken);
                if (deleted > 0)
                    await uow.SaveChangesAsync(stoppingToken);

                _logger.LogInformation("TokenCleanup: removed {Count} expired tokens", deleted);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex , "TokenCleanup failed");
            }
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
//Singleton (живе весь час), а репозиторії — Scoped.
//Щоб використати Scoped у Singleton, створюю scope вручну всередині циклу».
