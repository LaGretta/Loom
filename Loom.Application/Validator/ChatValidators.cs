using FluentValidation;
using Loom.Application.DTO;

namespace Loom.Application.Validator;

public class CreateChatDtoValidator : AbstractValidator<CreateChatDto>
{
    public CreateChatDtoValidator()
    {
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.Title)
            .NotEmpty().MaximumLength(100)
            .When(x => x.Type != Domain.Enums.ChatType.Direct);
    }
}