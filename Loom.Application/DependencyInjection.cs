using System.Reflection;
using FluentValidation;
using Loom.Application.Interfaces.Service;
using Loom.Application.Service;
using Microsoft.Extensions.DependencyInjection;

namespace Loom.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<IMessageService, MessageService>();
        services.AddScoped<IStarService, StarService>();
        services.AddScoped<IGiftService, GiftService>();

        services.AddAutoMapper(cfg => 
            cfg.AddMaps(Assembly.GetExecutingAssembly()));

        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        return services;
    }
}