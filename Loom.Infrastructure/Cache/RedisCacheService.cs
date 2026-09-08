using System.Text.Json;
using Loom.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace Loom.Infrastructure.Cache;

public class RedisCacheService : ICacheService
{
    private readonly IDistributedCache _cache;

    public RedisCacheService(IDistributedCache cache) => _cache = cache;

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct)
    {
        var json = await _cache.GetStringAsync(key, ct);
        if (string.IsNullOrEmpty(json))
            return default;                      

        return JsonSerializer.Deserialize<T>(json);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(value);
        await _cache.SetStringAsync(key, json,
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl }, ct);
    }

    public async Task RemoveAsync(string key, CancellationToken ct) =>
        await _cache.RemoveAsync(key, ct);
}