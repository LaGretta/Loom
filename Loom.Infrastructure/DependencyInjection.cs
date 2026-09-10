using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Interfaces.Security;
using Loom.Infrastructure.Cache;
using Loom.Infrastructure.Data;
using Loom.Infrastructure.Media;
using Loom.Infrastructure.Payments;
using Loom.Infrastructure.Repository;
using Loom.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Loom.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<LoomDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IChatRepository, ChatRepository>();
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<IStarRepository, StarRepository>();
        services.AddScoped<IGiftRepository, GiftRepository>();
        services.AddScoped<IEventRepository, EventRepository>();
        
        
        services.AddScoped<IPaymentService, StripePaymentService>();

        services.AddScoped<IMediaStorage, CloudinaryStorage>();

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        var redisConnection = configuration["Redis:Connection"];
        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnection;
                options.InstanceName = "loom:";
            });
            services.AddScoped<ICacheService, RedisCacheService>();
        }
        else
        {
            services.AddScoped<ICacheService, NoOpCacheService>();
        }

        return services;
    }
}