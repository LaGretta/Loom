namespace Loom.Application.Interfaces;

public interface IMediaStorage
{
    Task<string> UploadImageAsync(Stream fileStream, string fileName, CancellationToken ct);
}