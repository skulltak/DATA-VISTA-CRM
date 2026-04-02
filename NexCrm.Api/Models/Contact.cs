using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace NexCrm.Api.Models;

public class Contact
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Company { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}
