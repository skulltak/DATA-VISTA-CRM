using NexCrm.Api.Data;
using NexCrm.Api.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Register Encoding Provider for ExcelDataReader
Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

// Add services to the container.
builder.Services.AddHostedService<FileWatcherService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register MongoDB context as singleton (MongoClient is thread-safe)
builder.Services.AddSingleton<MongoDbContext>();

builder.Services.AddControllers();
builder.Services.AddSignalR(); // Add SignalR

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://nexcrm-ui.onrender.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials() // Required for SignalR
              .WithExposedHeaders("X-Total-Count");
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular"); // Use named policy for SignalR support

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapControllers();
app.MapHub<NexCrm.Api.Hubs.NotificationHub>("/notificationHub"); // Map Hub

app.Run();
