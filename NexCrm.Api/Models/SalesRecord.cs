using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace NexCrm.Api.Models;

public class SalesRecord
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? StoreName { get; set; }
    public string? Brand { get; set; }
    public string? Product { get; set; }
    public string? SerialNo { get; set; }
    public string? BillValue { get; set; }
    public string? BillDate { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerContact { get; set; }
    public string? CustomerEmailId { get; set; }
    public string? BrandWarranty { get; set; }
    public string? ExtendedWarranty { get; set; }
    public string? ActivationValue { get; set; }
    public string? BillNo { get; set; }
    public string? OrderId { get; set; }
    public string? MaiYesNo { get; set; }
    public string? Payment { get; set; }
    public string? DateReceived { get; set; }
}
