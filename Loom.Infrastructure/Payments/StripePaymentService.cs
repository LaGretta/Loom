using Loom.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace Loom.Infrastructure.Payments;

public class StripePaymentService : IPaymentService
{
    private readonly IConfiguration _config;

    public StripePaymentService(IConfiguration config)
    {
        _config = config;
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
    }
    public async Task<(string sessionId, string url)> CreateCheckoutSessionAsync(
        int userId, int starAmount, long priceCents, string currency, CancellationToken ct)
    {
        var baseUrl = _config["App:BaseUrl"]!.TrimEnd('/');

        var options = new SessionCreateOptions
        {
            Mode = "payment",
            SuccessUrl = $"{baseUrl}/stars?purchase=success",
            CancelUrl = $"{baseUrl}/stars?purchase=cancelled",
            LineItems = new List<SessionLineItemOptions>
            {
                new()
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = currency,
                        UnitAmount = priceCents,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"{starAmount} Loom Stars"
                        }
                    }
                }
            },
            // сюди кладемо своє воно повернеться у вебхуку
            Metadata = new Dictionary<string, string>
            {
                ["userId"] = userId.ToString(),
                ["starAmount"] = starAmount.ToString()
            }
        };

        var session = await new SessionService().CreateAsync(options, cancellationToken: ct);
        return (session.Id, session.Url);
    }

    public (int userId, string sessionId, long amountPaid, string currency)? ParseCompletedCheckout(
        string json, string signatureHeader)
    {
        var webhookSecret = _config["Stripe:WebhookSecret"];

        var stripeEvent = EventUtility.ConstructEvent(json, signatureHeader, webhookSecret);

        if (stripeEvent.Type != "checkout.session.completed")
            return null;
        if (stripeEvent.Data.Object is not Session session)
            return null;
        if (session.PaymentStatus != "paid")
            return null;
        if (!session.Metadata.TryGetValue("userId", out var userIdRaw) ||
            !int.TryParse(userIdRaw, out var userId))
            return null;

        return (userId, session.Id, session.AmountTotal ?? 0, session.Currency ?? "usd");
    }
}