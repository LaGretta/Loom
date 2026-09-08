using Loom.Application.Interfaces;

namespace Loom.Infrastructure.Cache;

public class NoOpCacheService : ICacheService
{
    public Task<T?> GetAsync<T>(string key, CancellationToken ct) => Task.FromResult<T?>(default);
    public Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct) => Task.CompletedTask;
    public Task RemoveAsync(string key, CancellationToken ct) => Task.CompletedTask;
}