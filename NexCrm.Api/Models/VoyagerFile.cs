using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace NexCrm.Api.Models;

public class VoyagerFile
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    public string Name { get; set; } = string.Empty;
    public long Size { get; set; }
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;
    public string SheetsJson { get; set; } = "[]";
}
