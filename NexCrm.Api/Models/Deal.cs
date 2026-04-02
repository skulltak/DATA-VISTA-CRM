using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace NexCrm.Api.Models;

public class Deal
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    public string Title { get; set; } = string.Empty;
    public string? Company { get; set; }
    public decimal Value { get; set; }
    public string Stage { get; set; } = "Lead";
    public string? Contact { get; set; }
    public string? Notes { get; set; }
}
