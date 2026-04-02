using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace NexCrm.Api.Models;

public class ImportedFile
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    public string FileName { get; set; } = string.Empty;
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;
    public string HeadersJson { get; set; } = "[]";
}

public class ImportedRecord
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    public string FileId { get; set; } = string.Empty;
    public string DataJson { get; set; } = "{}";
}
