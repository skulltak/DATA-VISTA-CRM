using System.IO;
using NexCrm.Api.Data;
using NexCrm.Api.Models;
using ExcelDataReader;
using System.Text.Json;
using System.Data;
using MongoDB.Bson;
using Microsoft.AspNetCore.SignalR;
using NexCrm.Api.Hubs;

namespace NexCrm.Api.Services;

public class FileWatcherService : BackgroundService
{
    private readonly ILogger<FileWatcherService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly string _watchPath;

    public FileWatcherService(
        ILogger<FileWatcherService> logger, 
        IServiceProvider serviceProvider, 
        IConfiguration configuration,
        IHubContext<NotificationHub> hubContext)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _hubContext = hubContext;

        // Default to Downloads folder on Windows if not configured
        var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var downloadsPath = Path.Combine(userProfile, "Downloads");
        
        _watchPath = configuration["FileWatcher:Path"] ?? downloadsPath;
        
        if (!Directory.Exists(_watchPath))
        {
            Directory.CreateDirectory(_watchPath);
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("FileWatcherService starting at path: {Path}", _watchPath);

        using var watcher = new FileSystemWatcher(_watchPath)
        {
            Filter = "*.*",
            NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite,
            EnableRaisingEvents = true
        };

        watcher.Created += async (s, e) => await OnFileCreated(e.FullPath);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(1000, stoppingToken);
        }
    }

    private async Task OnFileCreated(string filePath)
    {
        var fileName = Path.GetFileName(filePath);
        var ext = Path.GetExtension(filePath).ToLower();
        
        // Amazon reports often start with "JobReport" or contain specific keywords
        bool isAmazonReport = fileName.Contains("JobReport", StringComparison.OrdinalIgnoreCase) || 
                              fileName.Contains("Report", StringComparison.OrdinalIgnoreCase);

        if (ext != ".xlsx" && ext != ".xls" && ext != ".csv") return;

        _logger.LogInformation("New file detected: {FilePath}. Starting auto-import...", filePath);
        
        // Notify UI that fetching has started
        await _hubContext.Clients.All.SendAsync("ReceiveNotification", "Fetching data from Vista Portal...", "fetching");

        try 
        {
            // Wait a bit for the file to be fully written/released by the browser
            await Task.Delay(2000); 
            await ProcessFileAsync(filePath);
            
            // Notify UI of success
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", "Data fetched and imported successfully!", "success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error auto-importing file: {FilePath}", filePath);
            // Notify UI of error
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", "Failed to fetch data from Vista Portal.", "error");
        }
    }

    private async Task ProcessFileAsync(string filePath)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MongoDbContext>();

        // Open with sharing enabled to avoid access issues while browser finishes writing
        using var stream = File.Open(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        using var reader = ExcelReaderFactory.CreateReader(stream);
        var result = reader.AsDataSet(new ExcelDataSetConfiguration()
        {
            ConfigureDataTable = (_) => new ExcelDataTableConfiguration() { UseHeaderRow = true }
        });

        if (result.Tables.Count == 0) return;

        var table = result.Tables[0];
        var headers = table.Columns.Cast<DataColumn>().Select(c => c.ColumnName).ToList();

        var importedFile = new ImportedFile
        {
            Id = ObjectId.GenerateNewId().ToString(),
            FileName = Path.GetFileName(filePath),
            HeadersJson = JsonSerializer.Serialize(headers)
        };

        var recordsToInsert = new List<ImportedRecord>();
        foreach (DataRow row in table.Rows)
        {
            var rowData = new Dictionary<string, object?>();
            foreach (DataColumn col in table.Columns)
            {
                rowData[col.ColumnName] = row[col] == DBNull.Value ? null : row[col];
            }

            recordsToInsert.Add(new ImportedRecord
            {
                Id = ObjectId.GenerateNewId().ToString(),
                FileId = importedFile.Id,
                DataJson = JsonSerializer.Serialize(rowData)
            });
        }

        await context.ImportedFiles.InsertOneAsync(importedFile);
        if (recordsToInsert.Any())
        {
            await context.ImportedRecords.InsertManyAsync(recordsToInsert);
        }
        
        _logger.LogInformation("Successfully auto-imported {Count} records from {FileName}", recordsToInsert.Count, importedFile.FileName);
    }
}
