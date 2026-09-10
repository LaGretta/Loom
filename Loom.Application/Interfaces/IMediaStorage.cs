namespace Loom.Application.Interfaces;

public interface IMediaStorage
{
    Task<string> UploadAsync(Stream fileStream, string fileName, CancellationToken ct);
}