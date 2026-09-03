using AutoMapper;
using FluentAssertions;
using Loom.Application.DTO;
using Loom.Application.Interfaces;
using Loom.Application.Interfaces.Repository;
using Loom.Application.Service;
using Loom.Domain.Entities.Stars;
using Loom.Domain.Entities.Users;
using Moq;
using Xunit;

namespace Loom.Tests;

public class StarServiceTests
{
    private readonly Mock<IStarRepository> _starRepo = new();
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IMapper> _mapper = new();
    private readonly StarService _sut;

    public StarServiceTests()
    {
        _sut = new StarService(
            _starRepo.Object, 
            _mapper.Object,    
            _uow.Object,         
            _userRepo.Object);
    }

    [Fact]
    public async Task PurchaseStars_AddsToBalance()
    {
        var user = new User { Id = 1, StarBalance = 500 };
        _userRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var result = await _sut.PurchaseStars(1, new PurchaseStarsDto { Amount = 300 }, CancellationToken.None);

        user.StarBalance.Should().Be(800);   // 500 + 300
        result.Balance.Should().Be(800);
        _starRepo.Verify(r => r.AddTransactionAsync(It.IsAny<StarTransaction>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}