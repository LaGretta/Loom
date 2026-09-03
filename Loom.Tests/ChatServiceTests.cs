using AutoMapper;
using FluentAssertions;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Service;
using Moq;
using Xunit;

namespace Loom.Tests;

public class ChatServiceTests
{
    private readonly Mock<IChatRepository> _chatRepo = new();
    private readonly Mock<IMessageRepository> _messageRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly ChatService _sut;

    public ChatServiceTests()
    {
        _sut = new ChatService(
            chatRepo: _chatRepo.Object,
            messageRepo: _messageRepo.Object,
            unitOfWork: _uow.Object,
            mapper: _mapper.Object);
    }
    [Fact]
    public async Task GetChatById_NotMember_ThrowsUnauthorized()
    {
        _chatRepo.Setup(r => r.IsMemberAsync(5, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);  

        var act = () => _sut.GetChatById(1, 5, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
    [Fact]
    public async Task GetMembers_NotMember_ThrowsUnauthorized()
    {
        _chatRepo.Setup(r => r.IsMemberAsync(5, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var act = () => _sut.GetMembers(1, 5, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}