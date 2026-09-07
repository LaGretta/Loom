using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;

namespace Loom.API.Workers;

public class PresenceWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<PresenceWorker> _logger;

    public PresenceWorker(IServiceProvider services, ILogger<PresenceWorker> logger)
    {
        _services = services;
        _logger = logger;
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                var count = await userRepo.MarkStaleUsersOfflineAsync(TimeSpan.FromMinutes(5), stoppingToken);
                if (count > 0)
                    await uow.SaveChangesAsync(stoppingToken);
                _logger.LogInformation("PresenceWorker: marked {Count} stale users offline", count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PresenceWorker failed");
            }
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);   
        }
    }
}