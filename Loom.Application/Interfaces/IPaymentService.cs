namespace Loom.Application.Interfaces;

public interface IPaymentService
{
    Task<(string sessionId, string url)> CreateCheckoutSessionAsync(
        int userId, int starAmount, long priceCents, string currency, CancellationToken ct);

    // повертає (userId sessionId сплачено) або null якщо подія нас не цікавить
    (int userId, string sessionId, long amountPaid, string currency)? ParseCompletedCheckout(
        string json, string signatureHeader);
}