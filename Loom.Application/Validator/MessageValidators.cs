using FluentValidation;
using Loom.Application.DTO;

namespace Loom.Application.Validator;

public class SendMessageDtoValidator : AbstractValidator<SendMessageDto>
{
    public SendMessageDtoValidator()
    {
        RuleFor(x => x.ChatId).GreaterThan(0);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(4000);
    }
}
public class EditMessageDtoValidator : AbstractValidator<EditMessageDto>
{
    public EditMessageDtoValidator()
    {
        RuleFor(x => x.MessageId).GreaterThan(0);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(4000);
    }
}
public class ToggleReactionDtoValidator : AbstractValidator<ToggleReactionDto>
{
    public ToggleReactionDtoValidator()
    {
        RuleFor(x => x.MessageId).GreaterThan(0);
        RuleFor(x => x.Emoji).NotEmpty().MaximumLength(10);
    }
}