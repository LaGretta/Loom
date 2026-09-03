using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Loom.API.Filters;

public class ValidationFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _services;
    public ValidationFilter(IServiceProvider services) => _services = services;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var arg in context.ActionArguments.Values)
        {
            if (arg == null) continue;
            var validatorType = typeof(IValidator<>).MakeGenericType(arg.GetType());
            if (_services.GetService(validatorType) is not IValidator validator) continue;

            var vctx = new ValidationContext<object>(arg);
            var result = await validator.ValidateAsync(vctx, context.HttpContext.RequestAborted);
            if (!result.IsValid)
            {
                var errors = result.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                context.Result = new BadRequestObjectResult(new ValidationProblemDetails(errors));
                return;
            }
        }
        await next();
    }
}